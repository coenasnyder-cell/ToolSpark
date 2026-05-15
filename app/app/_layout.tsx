import { Stack } from 'expo-router';
import React, { useEffect } from 'react';

export default function AppLayout() {

  useEffect(() => {
    console.log('[AppLayout] mounted');
    return () => console.log('[AppLayout] unmounted');
  }, []);

  return (
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="local-businesses" />
          <Stack.Screen name="businesslocal" />
          <Stack.Screen name="business-settings" />
          <Stack.Screen name="business-edit-profile" />
          <Stack.Screen name="business-reputation" />
          <Stack.Screen name="create-deal-listing" />
          <Stack.Screen name="create-yard-sale" />
          <Stack.Screen name="create-event-listing" />
          <Stack.Screen name="create-service-listing" />
          <Stack.Screen name="service-details" />
          <Stack.Screen name="post-promote" />
          <Stack.Screen name="eventslist" />
          <Stack.Screen name="searchlistings" />
          <Stack.Screen name="joblistings" />
          <Stack.Screen name="support-hub" />
          <Stack.Screen name="community-guidelines" />
          <Stack.Screen name="contactus" />
          <Stack.Screen name="deals" />
          <Stack.Screen name="featured-listings" />
          <Stack.Screen name="yardsalelistings" />
          <Stack.Screen name="yard-sale-detail" />
          <Stack.Screen name="blocked-users" />
          <Stack.Screen name="threadchat" />
          <Stack.Screen name="business-leads" />
          <Stack.Screen name="pet-details" />
          <Stack.Screen name="create-pet-post" />
          <Stack.Screen name="create-adoption-listing" />
          <Stack.Screen name="browse-pets" />
          <Stack.Screen name="businessprofile" />
          <Stack.Screen name="upgrade-business" />
          <Stack.Screen name="create-listing" />
          <Stack.Screen name="create-job-listing" />
          <Stack.Screen name="public-profile" />
          <Stack.Screen name="business-listings" />
          <Stack.Screen name="serviceslist" />
          <Stack.Screen name="premium-upgrade" />
          <Stack.Screen name="seller-pro-upgrade" />
          <Stack.Screen name="listing-posted" />
          <Stack.Screen name="pet-corner" />
          <Stack.Screen name="business-hub" />
          <Stack.Screen name="seller-profile" />
          <Stack.Screen name="seller-edit-profile" />
          <Stack.Screen name="seller-notifications" />
          <Stack.Screen name="seller-inbox" />
          <Stack.Screen name="paywall" />
          <Stack.Screen name="customer-center" />
          <Stack.Screen name="admin-panel" />
          <Stack.Screen name="business-assistantai" />
          <Stack.Screen name="notifications" />
        </Stack>
  );
}