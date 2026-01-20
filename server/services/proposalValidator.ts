import { 
  ChangeProposalManifestSchema, 
  ToolManifestSchema, 
  UiWidgetManifestSchema,
  FeatureFlagManifestSchema,
  WorkflowManifestSchema,
  type SubmitChangeProposal,
  type ValidateProposal
} from '@shared/schema';
import { storage } from '../storage';
import { z } from 'zod';

export interface ValidationReport {
  isValid: boolean;
  securityChecks: {
    passed: boolean;
    issues: string[];
  };
  dependencyChecks: {
    passed: boolean;
    missing: string[];
    conflicts: string[];
  };
  schemaValidation: {
    passed: boolean;
    errors: string[];
  };
  resourceValidation: {
    passed: boolean;
    warnings: string[];
  };
}

export class ProposalValidatorService {
  /**
   * Validate a complete change proposal
   */
  async validateProposal(proposal: SubmitChangeProposal): Promise<ValidationReport> {
    const report: ValidationReport = {
      isValid: true,
      securityChecks: { passed: true, issues: [] },
      dependencyChecks: { passed: true, missing: [], conflicts: [] },
      schemaValidation: { passed: true, errors: [] },
      resourceValidation: { passed: true, warnings: [] },
    };

    // Schema validation
    await this.validateSchema(proposal, report);
    
    // Security validation
    await this.validateSecurity(proposal, report);
    
    // Dependency validation
    await this.validateDependencies(proposal, report);
    
    // Resource validation
    await this.validateResources(proposal, report);
    
    // Overall validity
    report.isValid = report.securityChecks.passed && 
                    report.dependencyChecks.passed && 
                    report.schemaValidation.passed;

    return report;
  }

  /**
   * Validate proposal schema structure
   */
  private async validateSchema(proposal: SubmitChangeProposal, report: ValidationReport): Promise<void> {
    try {
      // Validate main proposal structure
      ChangeProposalManifestSchema.parse(proposal.manifest);
      
      // Type-specific validation
      switch (proposal.type) {
        case 'tool':
          if ('tool' in proposal.manifest) {
            ToolManifestSchema.parse(proposal.manifest.tool);
          } else {
            report.schemaValidation.errors.push('Tool manifest missing in tool proposal');
          }
          break;
        case 'ui':
          if ('widget' in proposal.manifest) {
            UiWidgetManifestSchema.parse(proposal.manifest.widget);
          } else {
            report.schemaValidation.errors.push('Widget manifest missing in UI proposal');
          }
          break;
        case 'feature':
          if ('flag' in proposal.manifest) {
            FeatureFlagManifestSchema.parse(proposal.manifest.flag);
          } else {
            report.schemaValidation.errors.push('Feature flag manifest missing in feature proposal');
          }
          break;
        case 'workflow':
          if ('workflow' in proposal.manifest) {
            WorkflowManifestSchema.parse(proposal.manifest.workflow);
          } else {
            report.schemaValidation.errors.push('Workflow manifest missing in workflow proposal');
          }
          break;
      }
    } catch (error) {
      report.schemaValidation.passed = false;
      if (error instanceof z.ZodError) {
        report.schemaValidation.errors.push(...error.errors.map(e => 
          `${e.path.join('.')}: ${e.message}`
        ));
      } else {
        report.schemaValidation.errors.push('Unknown schema validation error');
      }
    }
  }

  /**
   * Validate security aspects of the proposal
   */
  private async validateSecurity(proposal: SubmitChangeProposal, report: ValidationReport): Promise<void> {
    switch (proposal.type) {
      case 'tool':
        if ('tool' in proposal.manifest) {
          await this.validateToolSecurity(proposal.manifest.tool, report);
        }
        break;
      case 'ui':
        if ('widget' in proposal.manifest) {
          await this.validateWidgetSecurity(proposal.manifest.widget, report);
        }
        break;
      case 'feature':
        if ('flag' in proposal.manifest) {
          await this.validateFeatureFlagSecurity(proposal.manifest.flag, report);
        }
        break;
      case 'workflow':
        if ('workflow' in proposal.manifest) {
          await this.validateWorkflowSecurity(proposal.manifest.workflow, report);
        }
        break;
    }
  }

  /**
   * Validate tool security
   */
  private async validateToolSecurity(tool: any, report: ValidationReport): Promise<void> {
    // Check dangerous permissions
    const dangerousPermissions = ['file_write', 'system_info'];
    const toolPermissions = tool.permissions || [];
    
    for (const perm of toolPermissions) {
      if (dangerousPermissions.includes(perm)) {
        report.securityChecks.issues.push(`Dangerous permission requested: ${perm}`);
      }
    }

    // Validate resource limits
    const limits = tool.resourceLimits || {};
    if (limits.maxMemoryMb > 1024) {
      report.securityChecks.issues.push(`Memory limit too high: ${limits.maxMemoryMb}MB (max: 1024MB)`);
    }
    if (limits.maxCpuPercent > 80) {
      report.securityChecks.issues.push(`CPU limit too high: ${limits.maxCpuPercent}% (max: 80%)`);
    }
    if (limits.maxExecutionTimeSeconds > 120) {
      report.securityChecks.issues.push(`Execution time too high: ${limits.maxExecutionTimeSeconds}s (max: 120s)`);
    }

    // Check for suspicious code patterns in entrypoint
    const suspiciousPatterns = ['eval(', 'exec(', 'import subprocess', 'os.system', 'shell=True'];
    if (tool.entrypoint) {
      for (const pattern of suspiciousPatterns) {
        if (tool.entrypoint.includes(pattern)) {
          report.securityChecks.issues.push(`Suspicious code pattern detected: ${pattern}`);
        }
      }
    }

    if (report.securityChecks.issues.length > 0) {
      report.securityChecks.passed = false;
    }
  }

  /**
   * Validate UI widget security
   */
  private async validateWidgetSecurity(widget: any, report: ValidationReport): Promise<void> {
    // Check component code for dangerous patterns
    const dangerousPatterns = ['eval(', 'dangerouslySetInnerHTML', 'document.cookie', 'localStorage.clear'];
    const code = widget.component?.code || '';
    
    for (const pattern of dangerousPatterns) {
      if (code.includes(pattern)) {
        report.securityChecks.issues.push(`Dangerous pattern in widget code: ${pattern}`);
      }
    }

    // Check permissions
    const dangerousPermissions = ['api_calls'];
    const widgetPermissions = widget.permissions || [];
    
    for (const perm of widgetPermissions) {
      if (dangerousPermissions.includes(perm)) {
        report.securityChecks.issues.push(`Dangerous widget permission: ${perm}`);
      }
    }

    // Validate code size
    if (code.length > 25000) {
      report.securityChecks.issues.push(`Widget code too large: ${code.length} chars (max: 25000)`);
    }

    if (report.securityChecks.issues.length > 0) {
      report.securityChecks.passed = false;
    }
  }

  /**
   * Validate feature flag security
   */
  private async validateFeatureFlagSecurity(flag: any, report: ValidationReport): Promise<void> {
    // Check rollout strategy
    const strategy = flag.rolloutStrategy;
    if (strategy?.type === 'percentage' && strategy.percentage > 10) {
      report.securityChecks.issues.push(`Initial rollout percentage too high: ${strategy.percentage}% (max: 10%)`);
    }

    if (report.securityChecks.issues.length > 0) {
      report.securityChecks.passed = false;
    }
  }

  /**
   * Validate workflow security
   */
  private async validateWorkflowSecurity(workflow: any, report: ValidationReport): Promise<void> {
    // Check for dangerous step types
    const steps = workflow.steps || [];
    for (const step of steps) {
      if (step.type === 'tool_execution' && step.config?.dangerous) {
        report.securityChecks.issues.push(`Dangerous workflow step: ${step.id}`);
      }
    }

    // Check permissions
    const dangerousPermissions = ['system_admin', 'user_impersonation'];
    const workflowPermissions = workflow.permissions || [];
    
    for (const perm of workflowPermissions) {
      if (dangerousPermissions.includes(perm)) {
        report.securityChecks.issues.push(`Dangerous workflow permission: ${perm}`);
      }
    }

    if (report.securityChecks.issues.length > 0) {
      report.securityChecks.passed = false;
    }
  }

  /**
   * Validate dependencies
   */
  private async validateDependencies(proposal: SubmitChangeProposal, report: ValidationReport): Promise<void> {
    switch (proposal.type) {
      case 'tool':
        if ('tool' in proposal.manifest) {
          await this.validateToolDependencies(proposal.manifest.tool, report);
        }
        break;
      case 'ui':
        if ('widget' in proposal.manifest) {
          await this.validateWidgetDependencies(proposal.manifest.widget, report);
        }
        break;
    }

    // Check for naming conflicts
    await this.checkNamingConflicts(proposal, report);
  }

  /**
   * Validate tool dependencies
   */
  private async validateToolDependencies(tool: any, report: ValidationReport): Promise<void> {
    const dependencies = tool.dependencies || [];
    
    // Check if all dependencies exist
    for (const dep of dependencies) {
      const existingTool = await storage.getToolByName(dep);
      if (!existingTool) {
        report.dependencyChecks.missing.push(`Required tool dependency not found: ${dep}`);
      }
    }

    if (report.dependencyChecks.missing.length > 0) {
      report.dependencyChecks.passed = false;
    }
  }

  /**
   * Validate widget dependencies
   */
  private async validateWidgetDependencies(widget: any, report: ValidationReport): Promise<void> {
    const dependencies = widget.component?.dependencies || [];
    
    // Check for known dangerous NPM packages
    const dangerousDeps = ['eval', 'vm2', 'serialize-javascript'];
    for (const dep of dependencies) {
      if (dangerousDeps.includes(dep)) {
        report.dependencyChecks.missing.push(`Dangerous dependency detected: ${dep}`);
      }
    }

    if (report.dependencyChecks.missing.length > 0) {
      report.dependencyChecks.passed = false;
    }
  }

  /**
   * Check for naming conflicts
   */
  private async checkNamingConflicts(proposal: SubmitChangeProposal, report: ValidationReport): Promise<void> {
    let name: string | undefined;
    
    switch (proposal.type) {
      case 'tool':
        if ('tool' in proposal.manifest) {
          name = proposal.manifest.tool.name;
          const existingTool = await storage.getToolByName(name);
          if (existingTool) {
            report.dependencyChecks.conflicts.push(`Tool name already exists: ${name}`);
          }
        }
        break;
      case 'ui':
        if ('widget' in proposal.manifest) {
          name = proposal.manifest.widget.name;
          const existingWidget = await storage.getUiWidgetByName(name);
          if (existingWidget) {
            report.dependencyChecks.conflicts.push(`Widget name already exists: ${name}`);
          }
        }
        break;
      case 'feature':
        if ('flag' in proposal.manifest) {
          name = proposal.manifest.flag.key;
          const existingFlag = await storage.getRegistryFeatureFlagByKey(name);
          if (existingFlag) {
            report.dependencyChecks.conflicts.push(`Feature flag key already exists: ${name}`);
          }
        }
        break;
    }

    if (report.dependencyChecks.conflicts.length > 0) {
      report.dependencyChecks.passed = false;
    }
  }

  /**
   * Validate resource requirements
   */
  private async validateResources(proposal: SubmitChangeProposal, report: ValidationReport): Promise<void> {
    switch (proposal.type) {
      case 'tool':
        if ('tool' in proposal.manifest) {
          const limits = proposal.manifest.tool.resourceLimits || {};
          if (limits.maxMemoryMb > 512) {
            report.resourceValidation.warnings.push(`High memory usage requested: ${limits.maxMemoryMb}MB`);
          }
        }
        break;
      case 'ui':
        if ('widget' in proposal.manifest) {
          const code = proposal.manifest.widget.component?.code || '';
          if (code.length > 10000) {
            report.resourceValidation.warnings.push(`Large widget code size: ${code.length} characters`);
          }
        }
        break;
    }
  }
}

export const proposalValidator = new ProposalValidatorService();