"""
Universal Tool Interface for the AGI system.

This module defines the interface for all tools that can be used by the AGI system,
providing a standardized way to register, discover, and execute tools.
"""

import logging
import time
import inspect
import json
from typing import Dict, List, Any, Optional, Union, Callable, Type

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class ToolResult:
    """Represents the result of a tool execution."""
    def __init__(self, success: bool, data: Any = None, error: str = None):
        self.success = success
        self.data = data
        self.error = error
        self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the result to a dictionary."""
        return {
            "success": self.success,
            "data": self.data,
            "error": self.error,
            "timestamp": self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ToolResult':
        """Create a ToolResult from a dictionary."""
        result = cls(
            success=data.get("success", False),
            data=data.get("data"),
            error=data.get("error")
        )
        result.timestamp = data.get("timestamp", time.time())
        return result
    
    @classmethod
    def success_result(cls, data: Any = None) -> 'ToolResult':
        """Create a successful result."""
        return cls(success=True, data=data)
    
    @classmethod
    def error_result(cls, error: str) -> 'ToolResult':
        """Create an error result."""
        return cls(success=False, error=error)


class ToolParameter:
    """Defines a parameter for a tool."""
    def __init__(
        self, 
        name: str, 
        type_: Type, 
        description: str, 
        required: bool = True,
        default: Any = None
    ):
        self.name = name
        self.type = type_
        self.description = description
        self.required = required
        self.default = default
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the parameter to a dictionary."""
        return {
            "name": self.name,
            "type": str(self.type.__name__),
            "description": self.description,
            "required": self.required,
            "default": self.default
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ToolParameter':
        """Create a ToolParameter from a dictionary."""
        type_map = {
            "str": str,
            "int": int,
            "float": float,
            "bool": bool,
            "list": list,
            "dict": dict
        }
        
        type_name = data.get("type", "str")
        type_ = type_map.get(type_name, str)
        
        return cls(
            name=data.get("name", ""),
            type_=type_,
            description=data.get("description", ""),
            required=data.get("required", True),
            default=data.get("default")
        )


class Tool:
    """Base class for all tools in the AGI system."""
    def __init__(
        self,
        name: str,
        description: str,
        category: str,
        parameters: List[ToolParameter] = None,
        version: str = "1.0.0"
    ):
        self.name = name
        self.description = description
        self.category = category
        self.parameters = parameters or []
        self.version = version
    
    def execute(self, **kwargs) -> ToolResult:
        """
        Execute the tool with the provided parameters.
        
        This method should be overridden by subclasses.
        """
        raise NotImplementedError("Tool subclasses must implement execute method")
    
    def validate_parameters(self, params: Dict[str, Any]) -> Optional[str]:
        """
        Validate the provided parameters against the tool's parameter definitions.
        
        Returns None if valid, or an error message if invalid.
        """
        # Check for required parameters
        for param in self.parameters:
            if param.required and param.name not in params:
                return f"Missing required parameter: {param.name}"
            
            # Check type if parameter is provided
            if param.name in params and params[param.name] is not None:
                # Skip type checking for None values
                param_value = params[param.name]
                
                # Special handling for lists and dicts
                if param.type == list and not isinstance(param_value, list):
                    return f"Parameter {param.name} must be a list"
                elif param.type == dict and not isinstance(param_value, dict):
                    return f"Parameter {param.name} must be a dictionary"
                # For primitive types
                elif param.type not in [list, dict] and not isinstance(param_value, param.type):
                    try:
                        # Attempt to convert
                        params[param.name] = param.type(param_value)
                    except (ValueError, TypeError):
                        return f"Parameter {param.name} must be of type {param.type.__name__}"
        
        # Check for unknown parameters
        param_names = [p.name for p in self.parameters]
        unknown_params = [k for k in params.keys() if k not in param_names]
        if unknown_params:
            return f"Unknown parameters: {', '.join(unknown_params)}"
        
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the tool to a dictionary."""
        return {
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "parameters": [p.to_dict() for p in self.parameters],
            "version": self.version
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Tool':
        """
        Create a Tool from a dictionary.
        
        This is a factory method that should be implemented by subclasses.
        """
        raise NotImplementedError("Tool subclasses must implement from_dict method")


class ToolRegistry:
    """Registry for all tools in the AGI system."""
    def __init__(self):
        self.tools: Dict[str, Tool] = {}
        self.categories: Dict[str, List[str]] = {}
        logging.info("ToolRegistry initialized")
    
    def register_tool(self, tool: Tool) -> bool:
        """
        Register a tool with the registry.
        
        Returns True if registration was successful, False otherwise.
        """
        if tool.name in self.tools:
            logging.warning(f"Tool with name '{tool.name}' already registered")
            return False
        
        self.tools[tool.name] = tool
        
        # Add to category
        if tool.category not in self.categories:
            self.categories[tool.category] = []
        
        self.categories[tool.category].append(tool.name)
        logging.info(f"Registered tool '{tool.name}' in category '{tool.category}'")
        
        return True
    
    def unregister_tool(self, tool_name: str) -> bool:
        """
        Unregister a tool from the registry.
        
        Returns True if unregistration was successful, False otherwise.
        """
        if tool_name not in self.tools:
            logging.warning(f"Tool with name '{tool_name}' not found in registry")
            return False
        
        tool = self.tools[tool_name]
        
        # Remove from category
        if tool.category in self.categories and tool_name in self.categories[tool.category]:
            self.categories[tool.category].remove(tool_name)
            
            # Remove category if empty
            if not self.categories[tool.category]:
                del self.categories[tool.category]
        
        # Remove tool
        del self.tools[tool_name]
        logging.info(f"Unregistered tool '{tool_name}'")
        
        return True
    
    def get_tool(self, tool_name: str) -> Optional[Tool]:
        """Get a tool by name."""
        return self.tools.get(tool_name)
    
    def get_all_tools(self) -> List[Tool]:
        """Get all registered tools."""
        return list(self.tools.values())
    
    def get_tools_by_category(self, category: str) -> List[Tool]:
        """Get all tools in a category."""
        if category not in self.categories:
            return []
        
        return [self.tools[name] for name in self.categories[category]]
    
    def get_categories(self) -> List[str]:
        """Get all categories."""
        return list(self.categories.keys())
    
    def execute_tool(self, tool_name: str, params: Dict[str, Any]) -> ToolResult:
        """
        Execute a tool by name with the provided parameters.
        
        Returns the result of the tool execution.
        """
        tool = self.get_tool(tool_name)
        if not tool:
            return ToolResult.error_result(f"Tool '{tool_name}' not found")
        
        # Validate parameters
        validation_error = tool.validate_parameters(params)
        if validation_error:
            return ToolResult.error_result(validation_error)
        
        # Add default values for missing parameters
        for param in tool.parameters:
            if param.name not in params and param.default is not None:
                params[param.name] = param.default
        
        try:
            # Execute tool
            return tool.execute(**params)
        except Exception as e:
            logging.error(f"Error executing tool '{tool_name}': {str(e)}")
            return ToolResult.error_result(f"Error executing tool: {str(e)}")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the registry to a dictionary."""
        return {
            "tools": {name: tool.to_dict() for name, tool in self.tools.items()},
            "categories": self.categories
        }
    
    def save_to_file(self, filepath: str) -> bool:
        """
        Save the registry to a file.
        
        Returns True if successful, False otherwise.
        """
        try:
            with open(filepath, 'w') as f:
                json.dump(self.to_dict(), f, indent=2)
            logging.info(f"Saved tool registry to {filepath}")
            return True
        except Exception as e:
            logging.error(f"Error saving tool registry to {filepath}: {str(e)}")
            return False


# Global registry instance
registry = ToolRegistry()


def register_tool(tool_class: Type[Tool]) -> Type[Tool]:
    """
    Decorator to register a tool class with the global registry.
    
    Example:
        @register_tool
        class MyTool(Tool):
            ...
    """
    # Create an instance of the tool
    tool = tool_class()
    
    # Register the tool
    registry.register_tool(tool)
    
    return tool_class


# Example usage
if __name__ == "__main__":
    # Define a simple tool
    class EchoTool(Tool):
        def __init__(self):
            super().__init__(
                name="echo",
                description="Echoes the input message",
                category="Utility",
                parameters=[
                    ToolParameter(
                        name="message",
                        type_=str,
                        description="Message to echo",
                        required=True
                    ),
                    ToolParameter(
                        name="repeat",
                        type_=int,
                        description="Number of times to repeat the message",
                        required=False,
                        default=1
                    )
                ]
            )
        
        def execute(self, message: str, repeat: int = 1) -> ToolResult:
            """Echo the message."""
            result = message * repeat
            return ToolResult.success_result(result)
        
        @classmethod
        def from_dict(cls, data: Dict[str, Any]) -> 'EchoTool':
            """Create an EchoTool from a dictionary."""
            tool = cls()
            tool.name = data.get("name", tool.name)
            tool.description = data.get("description", tool.description)
            tool.category = data.get("category", tool.category)
            tool.version = data.get("version", tool.version)
            
            # Parse parameters
            tool.parameters = []
            for param_data in data.get("parameters", []):
                tool.parameters.append(ToolParameter.from_dict(param_data))
            
            return tool
    
    # Register the tool
    registry.register_tool(EchoTool())
    
    # Execute the tool
    result = registry.execute_tool("echo", {"message": "Hello, world!", "repeat": 3})
    
    print(f"Tool result: {result.to_dict()}")
