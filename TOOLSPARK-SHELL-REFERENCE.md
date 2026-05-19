# ToolSpark Shell Reference
## Plug-and-Play Community Platform

---

## CORE SCREENS

```
app/
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   └── forgot-password.tsx
│
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx          ← community feed
│   ├── dashboard.tsx      ← courses tab
│   ├── tools.tsx          ← resources tab
│   └── profile.tsx        ← dashboard hub
│
├── (app)/
│   ├── _layout.tsx
│   ├── thread-detail.tsx
│   ├── course-player.tsx
│   ├── tool-detail.tsx
│   ├── member-profile.tsx
│   ├── members.tsx
│   ├── events.tsx
│   ├── notifications.tsx
│   ├── edit-profile.tsx
│   ├── settings.tsx
│   ├── privacy-policy.tsx
│   ├── terms.tsx
│   ├── admin-tools.tsx
│   ├── admin-tool-edit.tsx
│   ├── admin-events.tsx
│   └── admin-event-edit.tsx
│
├── _layout.tsx
└── index.tsx
```

---

## COMPONENTS

```
components/
├── community/
│   └── ListHeader.tsx
│
└── Shared/
    ├── Header.tsx
    ├── FormInput.tsx
    └── VideoPlayer.tsx
```

---

## CONSTANTS

```
constants/
├── colors.ts       ← change per client brand
├── typography.ts
└── layout.ts
```

---

## SERVICES

```
services/
└── firebase.ts     ← change Firebase config per client
```

---

## HOOKS

```
hooks/
└── useUnreadCount.ts
```

---

## CONFIG FILES

```
app.json            ← change per client
eas.json
firebase.json       ← lives in web folder
firestore.rules     ← lives in web folder
storage.rules       ← lives in web folder
package.json
```

---

## FIRESTORE COLLECTIONS

```
users
threads
threads/{id}/comments
courses
courses/{id}/lessons
userProgress
tools
Events
notifications
clarity_sessions
settings
```

### User Document Fields
```
userId
userEmail
clientEmail
displayName
photoURL
userRole          ← 'admin' or 'member'
bio
website
instagram
twitter
linkedin
youtube
projectTitle
projectDescription
projectImageURL
createdAt
lastSeen
```

### Thread Document Fields
```
authorId
authorName
authorPhotoURL
displayName
category
title
content
imageURL
likes
commentCount
reactions         ← map: userId → emoji
reactionCount
pinned
isPinned
isAnnouncement
createdAt
updatedAt
```

### Comment Document Fields
```
authorId
authorPhotoURL
displayName
content
gifUrl
likes
createdAt
```

### Course Document Fields
```
title
description
category
courseId
isFree
isPublished
order             ← must be number not string
thumbnail
totallessons      ← lowercase l
createdAt
```

### Lesson Document Fields
```
lessonTitle
lessonDescription
lessonContent     ← HTML from rich text editor
lessonOrder
lessonDuration
lessonType
videoUrl
isFree
createdAt
```

### UserProgress Document Fields
```
Document ID = {userId}_{courseId}

userId
clientEmail
displayName
courseId
completedLessons  ← array of lesson IDs
lastLessonId
percentComplete
startedAt
completedAt
```

### Tool Document Fields
```
name
category
description
imageUrl
videoUrl
articleContent    ← HTML
affiliateUrl
isFeatured
order             ← must be number not string
createdAt
```

### Event Document Fields
```
eventTitle
eventStart        ← string e.g. "May 26, 2026 12:00 PM CT"
eventLocation
eventURL          ← just the Zoom URL not full invitation
eventLength       ← minutes as number
description
status            ← 'upcoming', 'live', 'completed', 'cancelled'
isRecurring
createdAt
```

### Notification Document Fields
```
userId
type              ← 'like', 'comment', 'mention', 'event'
message
threadId
threadTitle
read              ← boolean
createdAt
```

---

## PER CLIENT CUSTOMIZATION CHECKLIST

```
□ constants/colors.ts     — update brand colors
□ app.json                — app name, bundle ID, scheme
□ services/firebase.ts    — new Firebase project config
□ firestore.rules         — deploy to new Firebase project
□ storage.rules           — deploy to new Firebase project
□ components/Shared/Header.tsx  — update logo/brand name
□ app/(auth)/login.tsx    — update welcome message
□ App icons               — icon.png, splash-icon.png, favicon.png
□ android-icon-foreground.png
□ android-icon-background.png
□ EAS project init        — eas init
□ Google OAuth client IDs — web and iOS
□ App Store Connect setup — iOS bundle ID
□ Google Play Console     — Android package name
□ Domain and hosting      — Firebase hosting
□ privacy-policy.tsx      — update company name and email
□ terms.tsx               — update company name and email
```

---

## KEY RULES AND GOTCHAS

```
1. Routes use /screen-name not /(app)/screen-name
2. File names must match import paths exactly (case sensitive)
3. authorPhotoURL is the correct field name (not authorPhoto)
4. displayName used in some docs alongside authorName — handle both
5. order field must be a NUMBER not a string for orderBy queries
6. Tab bar height: 85px, paddingBottom: 28 for iPhone home indicator
7. Firestore rules deploy from web folder not app folder
8. Google sign in requires EAS build — does not work in Expo Go
9. Image uploads go to Firebase Storage not local assets
10. Both platforms share the same Firebase project
```

---

## OPTIONAL FEATURES (add per client needs)

```
□ Google sign in           — @react-native-google-signin/google-signin
□ Push notifications       — Firebase Cloud Messaging (FCM)
□ Stripe payments          — stripe-react-native
□ RevenueCat               — react-native-purchases (in-app purchases)
□ Giphy integration        — GIF comments in community
□ Rich text rendering      — react-native-render-html
□ Rich text editor         — react-native-pell-rich-editor
□ Gamification / badges    — custom Firestore collections
□ Direct messaging         — threads subcollection pattern
□ Leaderboard              — query by threadCount or likes
□ Affiliate tracking       — custom URL params
□ Zapier/Make webhooks     — Firebase Functions triggers
□ Email marketing          — Mailchimp or ConvertKit integration
□ Analytics                — Firebase Analytics
```

---

## TECH STACK

```
Framework:     Expo (managed workflow)
Router:        Expo Router (file-based)
Language:      TypeScript
Database:      Firebase Firestore
Auth:          Firebase Auth
Storage:       Firebase Storage
Functions:     Firebase Cloud Functions
Hosting:       Firebase Hosting (web version)
Builds:        EAS (Expo Application Services)
Icons:         @expo/vector-icons (Ionicons, MaterialCommunityIcons)
Images:        expo-image
Video:         react-native-webview (YouTube, Loom, Vimeo embed)
HTML:          react-native-render-html
Picker:        Custom modal (FormInput component)
```

---

## FOLDER STRUCTURE (complete)

```
ClientProject/
│
├── app/                    ← Expo Router screens
│   ├── (auth)/
│   ├── (tabs)/
│   ├── (app)/
│   ├── _layout.tsx
│   └── index.tsx
│
├── components/
│   ├── community/
│   └── Shared/
│
├── constants/
├── hooks/
├── services/
├── types/
├── utils/
├── assets/
│   └── images/
│
├── app.json
├── eas.json
├── package.json
├── babel.config.js
├── tsconfig.json
└── .gitignore

WebVersion/                 ← separate folder
├── public/                 ← HTML pages
├── functions/              ← Firebase functions
├── firebase.json
├── firestore.rules
└── storage.rules
```

---

## BUILD AND DEPLOY COMMANDS

```bash
# Start development
npx expo start

# Deploy Firestore rules (from web folder)
cd ClientWeb
firebase deploy --only firestore:rules,storage

# Deploy web version
firebase deploy --only hosting

# EAS Android preview build (APK)
eas build --platform android --profile preview

# EAS iOS build
eas build --platform ios --profile production

# EAS submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## PRICING TIERS (ToolSpark Service)

```
Free Community    — basic community access
Paid Workflow     — $27/mo or $97 lifetime
Done For You      — $1,500 - $3,000+
```

---

*Last updated: May 2026*
*ToolSpark — Clarity. Build. Launch.*
