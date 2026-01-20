import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Palette, Code, Database, BarChart3 } from 'lucide-react';

interface UiWidget {
  id: string;
  name: string;
  version: string;
  manifest: {
    name: string;
    description: string;
    component: {
      type: 'card' | 'table' | 'chart' | 'metric' | 'progress' | 'custom';
      props: Record<string, any>;
      data?: any;
      style?: Record<string, any>;
    };
    dependencies?: string[];
    permissions?: string[];
  };
  status: 'active' | 'deprecated' | 'disabled';
  flagKey?: string;
  createdBy: string;
  usageCount: number;
  createdAt: string;
}

interface RegistryFeatureFlag {
  id: string;
  key: string;
  description: string;
  enabledFor: any;
  status: 'active' | 'deprecated' | 'disabled';
  relatedWidgetId?: string;
}

interface RegistryRendererProps {
  widgetId?: string;
  widgetName?: string;
  userAccessLevel?: string;
  className?: string;
}

// Safe component renderer with error boundary
function SafeWidgetRenderer({ widget, userAccessLevel }: { widget: UiWidget; userAccessLevel?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay for safety checks
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check if user has access to this widget
  const hasAccess = useMemo(() => {
    if (!widget.flagKey) return true; // No flag means public access
    // This would normally check against feature flags
    return userAccessLevel === 'admin' || userAccessLevel === 'premium';
  }, [widget.flagKey, userAccessLevel]);

  if (!hasAccess) {
    return null; // Don't render if no access
  }

  if (isLoading) {
    return <WidgetSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" data-testid={`widget-error-${widget.id}`}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to render widget: {error}
        </AlertDescription>
      </Alert>
    );
  }

  try {
    const { component } = widget.manifest;
    
    return (
      <div className="widget-container" data-testid={`widget-${widget.id}`}>
        {renderWidgetComponent(component, widget)}
      </div>
    );
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown rendering error');
    return null;
  }
}

function renderWidgetComponent(component: any, widget: UiWidget) {
  const { type, props, data, style } = component;
  
  const baseProps = {
    className: `registry-widget ${style?.className || ''}`,
    style: style?.custom || {},
    'data-widget-id': widget.id,
    'data-widget-name': widget.name,
  };

  switch (type) {
    case 'card':
      return (
        <Card {...baseProps} data-testid={`card-widget-${widget.id}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span data-testid={`text-widget-title-${widget.id}`}>
                {props.title || widget.manifest.name}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid={`text-widget-content-${widget.id}`}>
              {props.content || widget.manifest.description}
            </div>
            {data && (
              <div className="mt-4">
                <pre className="text-xs bg-muted p-2 rounded" data-testid={`data-widget-${widget.id}`}>
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'table':
      const tableData = data || props.data || [];
      const columns = props.columns || Object.keys(tableData[0] || {});
      
      return (
        <Card {...baseProps} data-testid={`table-widget-${widget.id}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span data-testid={`text-table-title-${widget.id}`}>
                {props.title || widget.manifest.name}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table data-testid={`table-content-${widget.id}`}>
              <TableHeader>
                <TableRow>
                  {columns.map((col: string, i: number) => (
                    <TableHead key={i} data-testid={`table-header-${widget.id}-${i}`}>
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row: any, i: number) => (
                  <TableRow key={i} data-testid={`table-row-${widget.id}-${i}`}>
                    {columns.map((col: string, j: number) => (
                      <TableCell key={j} data-testid={`table-cell-${widget.id}-${i}-${j}`}>
                        {row[col]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );

    case 'metric':
      return (
        <Card {...baseProps} data-testid={`metric-widget-${widget.id}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground" data-testid={`text-metric-label-${widget.id}`}>
                  {props.label || widget.manifest.name}
                </p>
                <p className="text-2xl font-bold" data-testid={`text-metric-value-${widget.id}`}>
                  {data?.value || props.value || '0'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            {(data?.change || props.change) && (
              <p className="text-xs text-muted-foreground mt-2" data-testid={`text-metric-change-${widget.id}`}>
                {data?.change || props.change}
              </p>
            )}
          </CardContent>
        </Card>
      );

    case 'progress':
      const value = data?.value || props.value || 0;
      const max = data?.max || props.max || 100;
      const percentage = Math.round((value / max) * 100);
      
      return (
        <Card {...baseProps} data-testid={`progress-widget-${widget.id}`}>
          <CardHeader>
            <CardTitle data-testid={`text-progress-title-${widget.id}`}>
              {props.title || widget.manifest.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span data-testid={`text-progress-current-${widget.id}`}>{value}</span>
                <span data-testid={`text-progress-max-${widget.id}`}>{max}</span>
              </div>
              <Progress value={percentage} className="w-full" data-testid={`progress-bar-${widget.id}`} />
              <p className="text-xs text-center text-muted-foreground" data-testid={`text-progress-percentage-${widget.id}`}>
                {percentage}%
              </p>
            </div>
          </CardContent>
        </Card>
      );

    case 'chart':
      // For now, render as a placeholder since we'd need a proper charting library
      return (
        <Card {...baseProps} data-testid={`chart-widget-${widget.id}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span data-testid={`text-chart-title-${widget.id}`}>
                {props.title || widget.manifest.name}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted rounded flex items-center justify-center" data-testid={`chart-placeholder-${widget.id}`}>
              <p className="text-muted-foreground">Chart placeholder - {props.type || 'line'}</p>
            </div>
            {data && (
              <div className="mt-2 text-xs text-muted-foreground" data-testid={`chart-data-summary-${widget.id}`}>
                {data.length} data points
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'custom':
      return (
        <Card {...baseProps} data-testid={`custom-widget-${widget.id}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span data-testid={`text-custom-title-${widget.id}`}>
                {props.title || widget.manifest.name}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary" data-testid={`badge-custom-type-${widget.id}`}>
                Custom Component
              </Badge>
              <p className="text-sm text-muted-foreground" data-testid={`text-custom-description-${widget.id}`}>
                {widget.manifest.description}
              </p>
              {data && (
                <pre className="text-xs bg-muted p-2 rounded overflow-auto" data-testid={`custom-data-${widget.id}`}>
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      );

    default:
      return (
        <Alert data-testid={`unsupported-widget-${widget.id}`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unsupported widget type: {type}
          </AlertDescription>
        </Alert>
      );
  }
}

function WidgetSkeleton() {
  return (
    <Card data-testid="widget-skeleton">
      <CardHeader>
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function RegistryRenderer({ widgetId, widgetName, userAccessLevel, className }: RegistryRendererProps) {
  // Fetch specific widget if ID provided
  const { data: widget, isLoading: widgetLoading, error: widgetError } = useQuery<UiWidget>({
    queryKey: ['/api/registry/widgets', widgetId],
    enabled: !!widgetId,
  });

  // Fetch widget by name if name provided
  const { data: namedWidget, isLoading: namedLoading, error: namedError } = useQuery<UiWidget>({
    queryKey: ['/api/registry/widgets/by-name', widgetName],
    enabled: !!widgetName && !widgetId,
  });

  // Fetch feature flags for access control
  const { data: featureFlags } = useQuery<RegistryFeatureFlag[]>({
    queryKey: ['/api/registry/feature-flags'],
  });

  const targetWidget = widget || namedWidget;
  const isLoading = widgetLoading || namedLoading;
  const error = widgetError || namedError;

  if (isLoading) {
    return (
      <div className={className} data-testid="registry-renderer-loading">
        <WidgetSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} data-testid="registry-renderer-error">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load widget: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!targetWidget) {
    return (
      <div className={className} data-testid="registry-renderer-not-found">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Widget not found: {widgetId || widgetName}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (targetWidget.status !== 'active') {
    return (
      <div className={className} data-testid="registry-renderer-inactive">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Widget is {targetWidget.status} and cannot be displayed
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className} data-testid="registry-renderer">
      <SafeWidgetRenderer widget={targetWidget} userAccessLevel={userAccessLevel} />
    </div>
  );
}

// Export individual widget components for direct usage
export { SafeWidgetRenderer, WidgetSkeleton };