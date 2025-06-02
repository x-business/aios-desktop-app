export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  TRIAL = 'trial'
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const subscriptionConverter = {
  toFirestore: (subscription: Subscription) => {
    return {
      userId: subscription.userId,
      plan: subscription.plan,
      status: subscription.status,
      stripeSubscriptionId: subscription.stripeSubscriptionId || null,
      stripeCustomerId: subscription.stripeCustomerId || null,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },
  fromFirestore: (snapshot: any): Subscription => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId,
      plan: data.plan,
      status: data.status,
      stripeSubscriptionId: data.stripeSubscriptionId || undefined,
      stripeCustomerId: data.stripeCustomerId || undefined,
      currentPeriodStart: data.currentPeriodStart.toDate(),
      currentPeriodEnd: data.currentPeriodEnd.toDate(),
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      canceledAt: data.canceledAt?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    };
  }
};