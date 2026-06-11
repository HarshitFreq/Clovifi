import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Accounts from "@/pages/accounts";
import Categories from "@/pages/categories";
import Settings from "@/pages/settings";
import Subscriptions from "@/pages/subscriptions";
import Login from "@/pages/login";
import Layout from "@/components/layout";
import { CurrencyProvider } from "@/lib/currency";
import { SoundProvider } from "@/lib/sound";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white font-medium">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#34D399] border-r-2 mr-3" />
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Login onSuccess={() => refetch()} />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/categories" component={Categories} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Apply theme
    const savedTheme = localStorage.getItem("clovifi_theme") || "emerald";
    const classes = ["theme-sapphire", "theme-amethyst", "theme-ruby", "theme-noir"];
    classes.forEach(c => document.documentElement.classList.remove(c));
    if (savedTheme !== "emerald" && classes.includes(`theme-${savedTheme}`)) {
      document.documentElement.classList.add(`theme-${savedTheme}`);
    }

    // Apply background style
    const savedBgStyle = localStorage.getItem("clovifi_bg_style") || "aurora";
    const bgClasses = ["bg-style-grid", "bg-style-oled"];
    bgClasses.forEach(c => document.documentElement.classList.remove(c));
    if (savedBgStyle !== "aurora" && bgClasses.includes(`bg-style-${savedBgStyle}`)) {
      document.documentElement.classList.add(`bg-style-${savedBgStyle}`);
    }
  }, []);

  return (
    <SoundProvider>
      <CurrencyProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </CurrencyProvider>
    </SoundProvider>
  );
}

export default App;

