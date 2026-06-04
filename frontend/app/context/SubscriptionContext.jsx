"use client";

import { createContext, useContext, useState } from "react";
import { subscriptionPlans } from "../utils/config";

const SubscriptionContext = createContext();
export function SubscriptionProvider({ children }) {
  const [activePlan, setActivePlan] = useState(subscriptionPlans.PROFESSIONAL);

  return (
    <SubscriptionContext.Provider value={{ activePlan, setActivePlan }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
export function useSubscription() {
  return useContext(SubscriptionContext);
}
