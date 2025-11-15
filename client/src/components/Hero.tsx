export function Hero() {
  return (
    <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Smarter rentals, powered by agents
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Livva uses AI agents to handle listings, matching, and deposits so you can focus on finding your perfect home.
          </p>
          <div className="flex justify-center">
            <button
              data-testid="button-waitlist"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-md font-medium hover-elevate active-elevate-2"
              onClick={() => console.log("Waitlist clicked")}
            >
              Join the waitlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
