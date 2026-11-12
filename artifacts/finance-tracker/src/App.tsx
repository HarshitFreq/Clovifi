import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Accounts from "@/pages/accounts";
import Categories from "@/pages/categories";
import Settings from "@/pages/settings";
import Subscriptions from "@/pages/subscriptions";
import Layout from "@/components/layout";
import { CurrencyProvider } from "@/lib/currency";
import { SoundProvider } from "@/lib/sound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const DashboardPage = () => (
  <Layout>
    <Dashboard />
  </Layout>
);

const TransactionsPage = () => (
  <Layout>
    <Transactions />
  </Layout>
);

const AccountsPage = () => (
  <Layout>
    <Accounts />
  </Layout>
);

const CategoriesPage = () => (
  <Layout>
    <Categories />
  </Layout>
);

const SubscriptionsPage = () => (
  <Layout>
    <Subscriptions />
  </Layout>
);

const SettingsPage = () => (
  <Layout>
    <Settings />
  </Layout>
);

const NotFoundPage = () => (
  <Layout>
    <NotFound />
  </Layout>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/landing" component={Landing} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/accounts" component={AccountsPage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/subscriptions" component={SubscriptionsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/:rest*" component={NotFoundPage} />
    </Switch>
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

