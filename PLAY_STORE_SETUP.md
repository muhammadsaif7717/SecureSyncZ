# Google Play Store Billing & RTDN Setup Guide

এই ডকুমেন্টটি শুধুমাত্র প্রোডাকশনে (Production) যাওয়ার সময় কাজে লাগবে। ডেভেলপমেন্ট বা টেস্টিংয়ের সময় এর কোনো দরকার নেই।

## ১. .env ফাইল সেটআপ

যখন আপনি প্লে স্টোর থেকে আসল পেমেন্ট রিসিভ করতে শুরু করবেন, তখন ফেক পারচেস ঠেকাতে গুগল এপিআই (Google API) দিয়ে টোকেন ভেরিফাই করতে হবে। এর জন্য আপনার গুগল ক্লাউড কনসোল থেকে একটি **Service Account** তৈরি করে তার ক্রেডেনশিয়ালগুলো (Credentials) আপনার প্রোডাকশন `.env` ফাইলে সেট করতে হবে।

```env
# Google Play Store Billing Verification (Production)
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account-email@project-id.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PLAY_PACKAGE_NAME="com.securesyncz.app"
```

_নোট: বর্তমানে `src/app/api/v1/billing/verify-purchase/route.ts` ফাইলে পেমেন্ট ভেরিফিকেশনটি বাইপাস (Mock) করা আছে। প্রোডাকশনে যাওয়ার আগে ঐ ফাইলের TODO কমেন্ট মুছে `googleapis` প্যাকেজ ব্যবহার করে আসল ভেরিফিকেশন লজিকটি অ্যাড করে নিতে হবে।_

---

## ২. রিয়েল-টাইম সাবস্ক্রিপশন স্ট্যাটাস আপডেট (Webhook)

ইউজারের সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেলে বা ক্যানসেল হলে, ডাটাবেজে তার `isPremium` স্ট্যাটাসটি নিজে থেকেই `false` করার জন্য আমরা একটি Webhook (`/api/v1/billing/webhook`) তৈরি করেছি। এটি লাইভ সার্ভারে কাজ করানোর জন্য নিচের ধাপগুলো অনুসরণ করুন:

### ধাপ ২.১: Google Cloud Console-এ Webhook URL বসানো

1. [Google Cloud Console](https://console.cloud.google.com/)-এ লগ-ইন করুন।
2. সার্চ বারে **"Pub/Sub"** লিখে সার্চ করুন।
3. **"Create Topic"**-এ ক্লিক করে নতুন একটি টপিক তৈরি করুন (যেমন: `play-store-notifications`)।
4. টপিকের ভেতরে গিয়ে **"Create Subscription"**-এ ক্লিক করুন।
5. Delivery Type হিসেবে **"Push"** সিলেক্ট করুন।
6. **Endpoint URL**-এ আপনার লাইভ সার্ভারের ওয়েবহুক URL-টি বসান।
   _(উদাহরণ: `https://your-domain.com/api/v1/billing/webhook`)_
7. Save করুন।

### ধাপ ২.২: Google Play Console-এ টপিক যুক্ত করা

1. [Google Play Console](https://play.google.com/console/)-এ লগ-ইন করে SecureSyncZ অ্যাপটি সিলেক্ট করুন।
2. বাম পাশের মেনু থেকে **"Monetize"** সেকশনের নিচে **"Monetization setup"**-এ যান।
3. নিচে স্ক্রোল করে **"Real-time developer notifications"** সেকশনটি খুঁজে বের করুন।
4. **Topic Name** বক্সে আপনার Google Cloud-এ তৈরি করা টপিকের নামটি বসিয়ে দিন।
   _(টপিকের নামটি দেখতে এমন হয়: `projects/your-project-id/topics/play-store-notifications`)_
5. **Send Test Notification** বাটনে ক্লিক করে চেক করুন এবং সবশেষে **Save** করে দিন।

ব্যাস! এইটুকু কনফিগার করলেই প্লে স্টোরের সাথে আপনার ব্যাকএন্ডের সাবস্ক্রিপশন সিস্টেম ১০০% সিঙ্ক হয়ে যাবে।
