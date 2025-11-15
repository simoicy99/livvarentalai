import { Search, Sparkles, User } from "lucide-react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Navbar({ onSearch, searchQuery = "" }: NavbarProps) {
  const hasClerk = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.startsWith('pk_');
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2" data-testid="link-home">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                L
              </div>
              <span className="font-bold text-xl hidden sm:block">Livva</span>
            </a>
          </div>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search San Francisco rentals..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={handleSearchChange}
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/agents">
              <Button variant="ghost" className="gap-2" data-testid="link-agents">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Agents</span>
              </Button>
            </Link>
            
            {hasClerk ? (
              <>
                <SignedOut>
                  <Link href="/sign-in">
                    <Button variant="default" data-testid="button-sign-in">
                      Sign In
                    </Button>
                  </Link>
                </SignedOut>
                
                <SignedIn>
                  <Link href="/portal">
                    <Button variant="ghost" data-testid="link-portal">
                      Portal
                    </Button>
                  </Link>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8"
                      }
                    }}
                  />
                </SignedIn>
              </>
            ) : (
              <Link href="/portal">
                <Button variant="ghost" size="icon" data-testid="button-profile">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
