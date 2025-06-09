import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react"; // Use market-related icon

export default function ChatIndexPage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full p-4 md:p-8 bg-gradient-to-br from-background via-secondary/30 to-background">
       <Card className="w-full max-w-md text-center shadow-lg border border-border/50">
           <CardHeader>
                <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" /> {/* Changed icon */}
                <CardTitle className="text-2xl font-serif text-primary">Welcome to StockWhisperer AI</CardTitle> {/* Updated title */}
                <CardDescription className="text-muted-foreground">
                    Start a new market discussion or select an existing one from the sidebar. {/* Updated description */}
                </CardDescription>
           </CardHeader>
           <CardContent>
               {/* Optionally add a button to start new chat here */}
               {/* <Button>Start New Discussion</Button> */}
           </CardContent>
       </Card>
    </div>
  );
}
