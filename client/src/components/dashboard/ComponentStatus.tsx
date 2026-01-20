import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComponentData {
  name: string;
  status: string;
  lastUpdate: string;
}

interface ComponentStatusProps {
  components: ComponentData[];
}

export default function ComponentStatus({ components }: ComponentStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-accent';
      case 'READY':
        return 'bg-primary';
      case 'INACTIVE':
        return 'bg-muted-foreground';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'READY':
        return 'secondary';
      case 'INACTIVE':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card data-testid="component-status">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Component Status</h3>
        <div className="space-y-4">
          {components.map((component) => (
            <div 
              key={component.name} 
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              data-testid={`component-${component.name}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`status-indicator ${getStatusColor(component.status)} rounded-full w-2 h-2`}></div>
                <span className="text-sm font-medium">{component.name}</span>
              </div>
              <Badge 
                variant={getStatusVariant(component.status)} 
                className="text-xs font-mono"
                data-testid={`component-status-${component.name}`}
              >
                {component.status}
              </Badge>
            </div>
          ))}
          
          {components.length === 0 && (
            <div className="text-center text-muted-foreground py-4" data-testid="no-components">
              No components data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
