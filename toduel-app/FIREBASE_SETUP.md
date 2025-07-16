# Firebase Setup Instructions for ToDuel Friend System

## Required Firebase Configuration

### 1. Firebase Realtime Database Rules

Go to Firebase Console → Realtime Database → Rules and replace with:

```json
{
  "rules": {
    "userProfiles": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid == $uid",
        "friends": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "friendRequests": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "incomingDuels": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "outgoingDuels": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    },
    "tasks": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

### 2. What These Rules Do:

- **userProfiles**: Allows all authenticated users to read user profiles (needed for friend search)
- **friends/friendRequests/duels/duelTasks**: Only the user can read/write their own data
- **tasks**: Only the user can access their own tasks

### 3. Steps to Apply:

1. Open Firebase Console: https://console.firebase.google.com
2. Select your project: `todoxp-8ad41`
3. Go to "Realtime Database" in left sidebar
4. Click "Rules" tab
5. Copy and paste the rules above
6. Click "Publish"

### 4. Testing the Friend System:

After applying the rules, you should be able to:
- Search for friends by email
- Send friend requests
- Accept/reject friend requests
- Challenge friends to duels

### 5. Current Database Structure:

```
userProfiles/
  {userId}/
    email: "user@example.com"
    displayName: "User Name"
    xp: 15
    level: 3
    friends/
      {friendId}: {...}
    friendRequests/
      {requestId}: {...}
    incomingDuels/
      {duelId}: {
        id: string,
        from: string,
        to: string,
        tasks: [{description, completedByChallenger, completedByChallenged, proofChallenger, proofChallenged}],
        stakeXP: number,
        durationHours: number,
        status: 'pending'|'active'|'completed',
        ...
      }
    outgoingDuels/
      {duelId}: {...} // Same structure as incoming
```

### 6. New Dueling System Features:

- **Custom Tasks**: 1-10 user-defined task descriptions that both users must complete
- **Competitive Verification**: Shared tasks with completion tracking for both participants  
- **XP Stakes**: Minimum 10 XP, no upper limit - winner takes all
- **Flexible Deadlines**: Up to 72 hours from challenge creation
- **Dual Storage**: Duels stored in both challenger's outgoingDuels and challenged user's incomingDuels

The friend search functionality requires reading all userProfiles to find users by email, which is why we need the global read permission for authenticated users.