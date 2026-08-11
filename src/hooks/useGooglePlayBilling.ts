"use client";

import { useState } from "react";
import { toast } from "sonner";

// Extend Window interface for Digital Goods API
declare global {
  interface Window {
    getDigitalGoodsService?: (serviceProvider: string) => Promise<any>;
  }
}

export function useGooglePlayBilling() {
  const [isProcessing, setIsProcessing] = useState(false);

  const initiatePurchase = async (sku: string = "premium_subscription") => {
    if (!window.getDigitalGoodsService) {
      toast.error(
        "Play Store Billing is not supported on this device. Please use the Android app."
      );
      return false;
    }

    try {
      setIsProcessing(true);

      // Connect to Google Play Billing
      const service = await window.getDigitalGoodsService(
        "https://play.google.com/billing"
      );

      // Verify the subscription details
      const details = await service.getDetails([sku]);
      if (!details || details.length === 0) {
        toast.error("Could not retrieve subscription details.");
        return false;
      }

      // Initiate payment
      const paymentMethods = [
        {
          supportedMethods: "https://play.google.com/billing",
          data: { sku: sku },
        },
      ];

      const request = new (window as any).PaymentRequest(paymentMethods);
      const paymentResponse = await request.show();

      const token = paymentResponse.details.token;

      // Verify purchase with backend
      const verifyRes = await fetch("/api/v1/billing/verify-purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, sku }),
      });

      const data = await verifyRes.json();

      if (verifyRes.ok && data.success) {
        await paymentResponse.complete("success");
        toast.success("Successfully upgraded to Premium!");

        // Reload page to reflect new premium status
        window.location.reload();
        return true;
      } else {
        await paymentResponse.complete("fail");
        toast.error("Payment verification failed. Please contact support.");
        return false;
      }
    } catch (error: any) {
      console.error("Billing error:", error);
      // Ignore abort errors if user closes the payment sheet
      if (error.name !== "AbortError") {
        toast.error("Payment failed or was canceled.");
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { initiatePurchase, isProcessing };
}
