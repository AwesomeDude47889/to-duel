import { 
  ref, 
  push, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  equalTo 
} from 'firebase/database';
import { database } from './firebase';

export interface Friend {
  id: string;
  friendId: string;
  email: string;
  displayName: string;
  status: 'accepted';
  addedAt: number;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  fromEmail: string;
  fromDisplayName: string;
  status: 'pending' | 'accepted' | 'rejected';
  sentAt: number;
}

export interface DuelTask {
  description: string;
  completedByChallenger: boolean;
  completedByChallenged: boolean;
  proofChallenger: string;
  proofChallenged: string;
}

export interface Duel {
  id: string;
  from: string; // challengerUID
  to: string; // challengedUID
  fromEmail: string;
  fromDisplayName: string;
  toEmail: string;
  toDisplayName: string;
  tasks: DuelTask[];
  stakeXP: number;
  durationHours: number;
  sentAt: string; // ISO timestamp
  deadline: string; // ISO timestamp
  status: 'pending' | 'accepted' | 'active' | 'completed' | 'expired';
  acceptedAt?: string;
  completedAt?: string;
  winnerId?: string;
  challengerProgress: number; // completed tasks count
  challengedProgress: number; // completed tasks count
}

export class FirebaseFriendsManager {
  private userId: string;
  private userProfileRef;
  private friendsRef;
  private friendRequestsRef;
  private incomingDuelsRef;
  private outgoingDuelsRef;

  constructor(userId: string) {
    this.userId = userId;
    this.userProfileRef = ref(database, `userProfiles/${userId}`);
    this.friendsRef = ref(database, `userProfiles/${userId}/friends`);
    this.friendRequestsRef = ref(database, `userProfiles/${userId}/friendRequests`);
    this.incomingDuelsRef = ref(database, `userProfiles/${userId}/incomingDuels`);
    this.outgoingDuelsRef = ref(database, `userProfiles/${userId}/outgoingDuels`);
  }

  // Search for users by email
  async searchUserByEmail(email: string): Promise<{ id: string; email: string; displayName: string } | null> {
    try {
      console.log('Searching for user with email:', email);
      
      // Search through all user profiles
      const usersRef = ref(database, 'userProfiles');
      const snapshot = await get(usersRef);
      
      console.log('User profiles snapshot exists:', snapshot.exists());
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        console.log('Available users:', Object.keys(users));
        
        for (const [userId, userData] of Object.entries(users as any)) {
          console.log(`Checking user ${userId}:`, userData.email, 'vs', email);
          if (userData.email?.toLowerCase() === email.toLowerCase() && userId !== this.userId) {
            console.log('Found matching user:', userId);
            return {
              id: userId,
              email: userData.email,
              displayName: userData.displayName || 'Unknown User'
            };
          }
        }
      }
      
      console.log('No matching user found');
      return null;
    } catch (error) {
      console.error('Error searching user by email:', error);
      throw error;
    }
  }

  // Send friend request
  async sendFriendRequest(toUserId: string, toEmail: string, toDisplayName: string): Promise<void> {
    try {
      // Check if already friends
      const friendsSnapshot = await get(this.friendsRef);
      if (friendsSnapshot.exists()) {
        const friends = friendsSnapshot.val();
        for (const friendId in friends) {
          if (friends[friendId].friendId === toUserId) {
            throw new Error('Already friends with this user');
          }
        }
      }

      // Check if request already exists
      const requestsSnapshot = await get(ref(database, `userProfiles/${toUserId}/friendRequests`));
      if (requestsSnapshot.exists()) {
        const requests = requestsSnapshot.val();
        for (const requestId in requests) {
          if (requests[requestId].fromId === this.userId && requests[requestId].status === 'pending') {
            throw new Error('Friend request already sent');
          }
        }
      }

      // Get current user info
      const currentUserSnapshot = await get(ref(database, `userProfiles/${this.userId}`));
      const currentUser = currentUserSnapshot.val();

      // Create friend request in the recipient's profile
      const requestsRef = ref(database, `userProfiles/${toUserId}/friendRequests`);
      const newRequestRef = push(requestsRef);
      
      await set(newRequestRef, {
        fromId: this.userId,
        toId: toUserId,
        fromEmail: currentUser?.email || '',
        fromDisplayName: currentUser?.displayName || 'Unknown User',
        status: 'pending',
        sentAt: Date.now()
      });

      console.log('Friend request sent successfully');
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  // Accept friend request
  async acceptFriendRequest(requestId: string, fromUserId: string, fromEmail: string, fromDisplayName: string): Promise<void> {
    try {
      // Add to both users' friend lists
      const currentUserSnapshot = await get(ref(database, `userProfiles/${this.userId}`));
      const currentUser = currentUserSnapshot.val();

      // Add friend to current user's list
      const myFriendsRef = push(this.friendsRef);
      await set(myFriendsRef, {
        friendId: fromUserId,
        email: fromEmail,
        displayName: fromDisplayName,
        status: 'accepted',
        addedAt: Date.now()
      });

      // Add friend to other user's list
      const otherFriendsRef = push(ref(database, `userProfiles/${fromUserId}/friends`));
      await set(otherFriendsRef, {
        friendId: this.userId,
        email: currentUser?.email || '',
        displayName: currentUser?.displayName || 'Unknown User',
        status: 'accepted',
        addedAt: Date.now()
      });

      // Remove the friend request
      await remove(ref(database, `userProfiles/${this.userId}/friendRequests/${requestId}`));

      console.log('Friend request accepted successfully');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  // Reject friend request
  async rejectFriendRequest(requestId: string): Promise<void> {
    try {
      await remove(ref(database, `userProfiles/${this.userId}/friendRequests/${requestId}`));
      console.log('Friend request rejected successfully');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  }

  // Get friends list
  onFriendsChange(callback: (friends: Friend[]) => void) {
    const unsubscribe = onValue(this.friendsRef, (snapshot) => {
      const friends: Friend[] = [];
      if (snapshot.exists()) {
        const friendsData = snapshot.val();
        Object.keys(friendsData).forEach(key => {
          friends.push({
            id: key,
            ...friendsData[key]
          });
        });
      }
      callback(friends);
    }, (error) => {
      console.error('Error listening to friends:', error);
      callback([]);
    });

    return () => off(this.friendsRef, 'value', unsubscribe);
  }

  // Get friend requests
  onFriendRequestsChange(callback: (requests: FriendRequest[]) => void) {
    const unsubscribe = onValue(this.friendRequestsRef, (snapshot) => {
      const requests: FriendRequest[] = [];
      if (snapshot.exists()) {
        const requestsData = snapshot.val();
        Object.keys(requestsData).forEach(key => {
          requests.push({
            id: key,
            ...requestsData[key]
          });
        });
      }
      callback(requests);
    }, (error) => {
      console.error('Error listening to friend requests:', error);
      callback([]);
    });

    return () => off(this.friendRequestsRef, 'value', unsubscribe);
  }

  // Challenge friend to duel with custom tasks
  async challengeFriend(
    friendId: string,
    friendEmail: string,
    friendDisplayName: string,
    customTasks: string[], // Array of task descriptions
    xpStake: number,
    durationHours: number
  ): Promise<void> {
    try {
      // Get current user info
      const currentUserSnapshot = await get(ref(database, `userProfiles/${this.userId}`));
      const currentUser = currentUserSnapshot.val();

      // Check if user has enough XP to stake
      if ((currentUser?.totalXP || 0) < xpStake) {
        throw new Error(`Insufficient XP! You need ${xpStake} XP but only have ${currentUser?.totalXP || 0} XP`);
      }

      // Validate inputs
      if (customTasks.length < 1 || customTasks.length > 10) {
        throw new Error('Must have 1-10 tasks');
      }
      if (xpStake < 10) {
        throw new Error('Minimum XP stake is 10');
      }
      if (durationHours > 72) {
        throw new Error('Maximum deadline is 72 hours');
      }

      // Create task objects
      const tasks: DuelTask[] = customTasks.map(description => ({
        description,
        completedByChallenger: false,
        completedByChallenged: false,
        proofChallenger: '',
        proofChallenged: ''
      }));

      const now = new Date();
      const deadline = new Date(now.getTime() + (durationHours * 60 * 60 * 1000));
      
      const duelData: Omit<Duel, 'id'> = {
        from: this.userId,
        to: friendId,
        fromEmail: currentUser?.email || '',
        fromDisplayName: currentUser?.displayName || 'Unknown User',
        toEmail: friendEmail,
        toDisplayName: friendDisplayName,
        tasks,
        stakeXP: xpStake,
        durationHours,
        sentAt: now.toISOString(),
        deadline: deadline.toISOString(),
        status: 'pending',
        challengerProgress: 0,
        challengedProgress: 0
      };

      // Create in outgoing duels for challenger
      const outgoingDuelRef = push(this.outgoingDuelsRef);
      const duelId = outgoingDuelRef.key!;
      await set(outgoingDuelRef, { ...duelData, id: duelId });

      // Create in incoming duels for challenged user
      const incomingDuelRef = ref(database, `userProfiles/${friendId}/incomingDuels/${duelId}`);
      await set(incomingDuelRef, { ...duelData, id: duelId });

      // Create duel tasks for challenger immediately when creating the challenge
      const { FirebaseTaskManager } = await import('./firebaseTasks');
      const challengerTaskManager = new FirebaseTaskManager(this.userId);
      
      for (let i = 0; i < customTasks.length; i++) {
        const taskDesc = customTasks[i];
        await challengerTaskManager.createTask({
          text: `Duel with ${friendDisplayName}: ${taskDesc}`,
          priority: 'high' as any,
          dueDate: deadline.toISOString().split('T')[0], // Extract date part
          duelId: duelId,
          duelTaskIndex: i,
          isDuelTask: true
        });
      }

      console.log('Duel challenge sent successfully');
    } catch (error) {
      console.error('Error challenging friend:', error);
      throw error;
    }
  }

  // Accept duel challenge
  async acceptDuel(duelId: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Get duel data first
      const duelSnapshot = await get(ref(database, `userProfiles/${this.userId}/incomingDuels/${duelId}`));
      if (!duelSnapshot.exists()) {
        throw new Error('Duel not found');
      }
      
      const duel = duelSnapshot.val();
      const stakeXP = duel.stakeXP;
      
      // Get both users' profiles to check XP
      const [challengerSnapshot, challengedSnapshot] = await Promise.all([
        get(ref(database, `userProfiles/${duel.from}`)),
        get(ref(database, `userProfiles/${this.userId}`))
      ]);
      
      const challengerProfile = challengerSnapshot.val();
      const challengedProfile = challengedSnapshot.val();
      
      // Check if both users have enough XP
      if ((challengerProfile?.totalXP || 0) < stakeXP) {
        throw new Error(`Challenger doesn't have enough XP (${challengerProfile?.totalXP || 0}/${stakeXP})`);
      }
      if ((challengedProfile?.totalXP || 0) < stakeXP) {
        throw new Error(`You don't have enough XP (${challengedProfile?.totalXP || 0}/${stakeXP})`);
      }
      
      // Deduct XP from both users
      const challengerNewXP = (challengerProfile?.totalXP || 0) - stakeXP;
      const challengedNewXP = (challengedProfile?.totalXP || 0) - stakeXP;
      
      // Update duel status and XP deduction
      const updates = {
        status: 'active',
        acceptedAt: now,
        stakeHold: {
          challengerDeducted: stakeXP,
          challengedDeducted: stakeXP,
          deductedAt: now
        }
      };

      // Update both duel locations and user XP simultaneously
      await Promise.all([
        update(ref(database, `userProfiles/${this.userId}/incomingDuels/${duelId}`), updates),
        update(ref(database, `userProfiles/${duel.from}/outgoingDuels/${duelId}`), updates),
        update(ref(database, `userProfiles/${duel.from}`), { totalXP: challengerNewXP }),
        update(ref(database, `userProfiles/${this.userId}`), { totalXP: challengedNewXP })
      ]);

      // Create duel tasks in both users' task lists
      const { FirebaseTaskManager } = await import('./firebaseTasks');
      const challengedTaskManager = new FirebaseTaskManager(this.userId);
      const challengerTaskManager = new FirebaseTaskManager(duel.from);
      const duelOpponent = duel.fromDisplayName;
      
      // Create tasks for challenged user (this user)
      for (let i = 0; i < duel.tasks.length; i++) {
        const duelTask = duel.tasks[i];
        await challengedTaskManager.createTask({
          text: `Duel with ${duelOpponent}: ${duelTask.description}`,
          priority: 'high' as any,
          dueDate: duel.deadline.split('T')[0], // Extract date part
          duelId: duelId,
          duelTaskIndex: i,
          isDuelTask: true
        });
      }
      
      // Create tasks for challenger user (only if different from current user)
      if (duel.from !== this.userId) {
        for (let i = 0; i < duel.tasks.length; i++) {
          const duelTask = duel.tasks[i];
          await challengerTaskManager.createTask({
            text: `Duel with ${duel.toDisplayName}: ${duelTask.description}`,
            priority: 'high' as any,
            dueDate: duel.deadline.split('T')[0], // Extract date part
            duelId: duelId,
            duelTaskIndex: i,
            isDuelTask: true
          });
        }
      }

      console.log('Duel accepted successfully, XP deducted from both users, tasks added to task list');
    } catch (error) {
      console.error('Error accepting duel:', error);
      throw error;
    }
  }

  // Reject duel challenge
  async rejectDuel(duelId: string): Promise<void> {
    try {
      // Get duel data first
      const duelSnapshot = await get(ref(database, `userProfiles/${this.userId}/incomingDuels/${duelId}`));
      if (!duelSnapshot.exists()) {
        throw new Error('Duel not found');
      }
      
      const duel = duelSnapshot.val();
      
      // Completely remove from both users' duel lists (no need to keep declined duels)
      await Promise.all([
        remove(ref(database, `userProfiles/${this.userId}/incomingDuels/${duelId}`)),
        remove(ref(database, `userProfiles/${duel.from}/outgoingDuels/${duelId}`))
      ]);

      console.log('Duel declined and deleted successfully');
    } catch (error) {
      console.error('Error declining duel:', error);
      throw error;
    }
  }

  // Forfeit active duel
  async forfeitDuel(duelId: string): Promise<void> {
    try {
      // Get duel data from both possible locations
      let duelSnapshot = await get(ref(database, `userProfiles/${this.userId}/incomingDuels/${duelId}`));
      let isChallenger = false;
      
      if (!duelSnapshot.exists()) {
        duelSnapshot = await get(ref(database, `userProfiles/${this.userId}/outgoingDuels/${duelId}`));
        isChallenger = true;
      }
      
      if (!duelSnapshot.exists()) {
        throw new Error('Duel not found');
      }
      
      const duel = duelSnapshot.val();
      
      if (duel.status !== 'active') {
        throw new Error('Can only forfeit active duels');
      }
      
      const opponentId = isChallenger ? duel.to : duel.from;
      const opponentName = isChallenger ? duel.toDisplayName : duel.fromDisplayName;
      
      // Award double XP to opponent (winner-takes-all)
      const totalXPReward = duel.stakeXP * 2;
      const opponentRef = ref(database, `userProfiles/${opponentId}`);
      const opponentSnapshot = await get(opponentRef);
      const opponentProfile = opponentSnapshot.val();
      
      await update(opponentRef, {
        totalXP: (opponentProfile?.totalXP || 0) + totalXPReward,
        xp: (opponentProfile?.xp || 0) + totalXPReward
      });
      
      // Update duel status to forfeited
      const forfeitUpdates = {
        status: 'forfeited',
        forfeitedBy: this.userId,
        forfeitedAt: new Date().toISOString(),
        winnerId: opponentId,
        completedAt: new Date().toISOString()
      };
      
      // Update both duel locations
      await Promise.all([
        update(ref(database, `userProfiles/${this.userId}/${isChallenger ? 'outgoingDuels' : 'incomingDuels'}/${duelId}`), forfeitUpdates),
        update(ref(database, `userProfiles/${opponentId}/${isChallenger ? 'incomingDuels' : 'outgoingDuels'}/${duelId}`), forfeitUpdates)
      ]);
      
      // Add to duel history for both users
      const historyData = {
        result: 'forfeit',
        method: 'forfeit',
        xpLost: duel.stakeXP,
        opponentName,
        completedAt: new Date().toISOString()
      };
      
      const winnerHistoryData = {
        result: 'win',
        method: 'forfeit',
        xpGained: totalXPReward,
        opponentName: isChallenger ? duel.fromDisplayName : duel.toDisplayName,
        completedAt: new Date().toISOString()
      };
      
      await Promise.all([
        set(ref(database, `userProfiles/${this.userId}/duelHistory/${duelId}`), historyData),
        set(ref(database, `userProfiles/${opponentId}/duelHistory/${duelId}`), winnerHistoryData)
      ]);
      
      // Delete the duel from active lists after 5 seconds (to allow UI updates)
      setTimeout(async () => {
        try {
          await Promise.all([
            remove(ref(database, `userProfiles/${this.userId}/${isChallenger ? 'outgoingDuels' : 'incomingDuels'}/${duelId}`)),
            remove(ref(database, `userProfiles/${opponentId}/${isChallenger ? 'incomingDuels' : 'outgoingDuels'}/${duelId}`))
          ]);
          console.log('Forfeited duel cleaned up');
        } catch (error) {
          console.error('Error cleaning up forfeited duel:', error);
        }
      }, 5000);
      
      console.log('Duel forfeited successfully');
    } catch (error) {
      console.error('Error forfeiting duel:', error);
      throw error;
    }
  }

  // Get duels (incoming and outgoing combined)
  onDuelsChange(callback: (duels: Duel[]) => void) {
    const allDuels: Duel[] = [];
    let incomingLoaded = false;
    let outgoingLoaded = false;

    const updateCallback = () => {
      if (incomingLoaded && outgoingLoaded) {
        callback([...allDuels]);
      }
    };

    // Listen to incoming duels
    const incomingUnsubscribe = onValue(this.incomingDuelsRef, (snapshot) => {
      // Clear existing incoming duels
      for (let i = allDuels.length - 1; i >= 0; i--) {
        if (allDuels[i].to === this.userId) {
          allDuels.splice(i, 1);
        }
      }

      if (snapshot.exists()) {
        const duelsData = snapshot.val();
        Object.keys(duelsData).forEach(key => {
          allDuels.push({
            id: key,
            ...duelsData[key]
          });
        });
      }
      incomingLoaded = true;
      updateCallback();
    }, (error) => {
      console.error('Error listening to incoming duels:', error);
      incomingLoaded = true;
      updateCallback();
    });

    // Listen to outgoing duels
    const outgoingUnsubscribe = onValue(this.outgoingDuelsRef, (snapshot) => {
      // Clear existing outgoing duels
      for (let i = allDuels.length - 1; i >= 0; i--) {
        if (allDuels[i].from === this.userId) {
          allDuels.splice(i, 1);
        }
      }

      if (snapshot.exists()) {
        const duelsData = snapshot.val();
        Object.keys(duelsData).forEach(key => {
          allDuels.push({
            id: key,
            ...duelsData[key]
          });
        });
      }
      outgoingLoaded = true;
      updateCallback();
    }, (error) => {
      console.error('Error listening to outgoing duels:', error);
      outgoingLoaded = true;
      updateCallback();
    });

    return () => {
      off(this.incomingDuelsRef, 'value', incomingUnsubscribe);
      off(this.outgoingDuelsRef, 'value', outgoingUnsubscribe);
    };
  }

  // Complete a task in a duel with proof
  async completeDuelTask(duelId: string, taskIndex: number, proof: { text?: string; imageURL?: string }): Promise<void> {
    try {
      const isIncoming = await get(ref(database, `userProfiles/${this.userId}/incomingDuels/${duelId}`));
      const isOutgoing = await get(ref(database, `userProfiles/${this.userId}/outgoingDuels/${duelId}`));
      
      let duelRef: any;
      let duel: any;
      let isChallenger: boolean;

      if (isIncoming.exists()) {
        duelRef = ref(database, `userProfiles/${this.userId}/incomingDuels/${duelId}`);
        duel = isIncoming.val();
        isChallenger = false;
      } else if (isOutgoing.exists()) {
        duelRef = ref(database, `userProfiles/${this.userId}/outgoingDuels/${duelId}`);
        duel = isOutgoing.val();
        isChallenger = true;
      } else {
        throw new Error('Duel not found');
      }

      // Update task completion with proof
      const updatedTasks = [...duel.tasks];
      const proofData = {
        text: proof.text || '',
        imageURL: proof.imageURL || '',
        submittedAt: new Date().toISOString()
      };

      if (isChallenger) {
        updatedTasks[taskIndex].completedByChallenger = true;
        updatedTasks[taskIndex].proofChallenger = proofData;
      } else {
        updatedTasks[taskIndex].completedByChallenged = true;
        updatedTasks[taskIndex].proofChallenged = proofData;
      }

      // Calculate progress
      const challengerProgress = updatedTasks.filter(t => t.completedByChallenger).length;
      const challengedProgress = updatedTasks.filter(t => t.completedByChallenged).length;

      const updates: any = {
        tasks: updatedTasks,
        challengerProgress,
        challengedProgress
      };

      // Check for winner
      const totalTasks = updatedTasks.length;
      let winnerId = null;
      
      if (challengerProgress === totalTasks && challengedProgress < totalTasks) {
        winnerId = duel.from;
      } else if (challengedProgress === totalTasks && challengerProgress < totalTasks) {
        winnerId = duel.to;
      }
      
      if (winnerId) {
        updates.status = 'completed';
        updates.completedAt = new Date().toISOString();
        updates.winnerId = winnerId;
        
        // Award XP to winner (2x the stake)
        const winnerXPReward = duel.stakeXP * 2;
        const winnerSnapshot = await get(ref(database, `userProfiles/${winnerId}`));
        const winnerProfile = winnerSnapshot.val();
        
        await update(ref(database, `userProfiles/${winnerId}`), {
          totalXP: (winnerProfile?.totalXP || 0) + winnerXPReward,
          xp: (winnerProfile?.xp || 0) + winnerXPReward
        });
        
        // Add to duel history for both users
        const winnerName = winnerId === duel.from ? duel.fromDisplayName : duel.toDisplayName;
        const loserName = winnerId === duel.from ? duel.toDisplayName : duel.fromDisplayName;
        const loserId = winnerId === duel.from ? duel.to : duel.from;
        
        const winnerHistoryData = {
          result: 'win',
          method: 'completion',
          xpGained: winnerXPReward,
          opponentName: loserName,
          completedAt: new Date().toISOString()
        };
        
        const loserHistoryData = {
          result: 'loss',
          method: 'completion',
          xpLost: duel.stakeXP,
          opponentName: winnerName,
          completedAt: new Date().toISOString()
        };
        
        await Promise.all([
          set(ref(database, `userProfiles/${winnerId}/duelHistory/${duelId}`), winnerHistoryData),
          set(ref(database, `userProfiles/${loserId}/duelHistory/${duelId}`), loserHistoryData)
        ]);
        
        // Delete the completed duel after 5 seconds (to allow UI updates)
        setTimeout(async () => {
          try {
            await Promise.all([
              remove(ref(database, `userProfiles/${duel.from}/outgoingDuels/${duelId}`)),
              remove(ref(database, `userProfiles/${duel.to}/incomingDuels/${duelId}`))
            ]);
            console.log('Completed duel cleaned up');
          } catch (error) {
            console.error('Error cleaning up completed duel:', error);
          }
        }, 5000);
      }

      // Update both locations
      await update(duelRef, updates);
      
      // Update the other user's copy
      if (isChallenger) {
        await update(ref(database, `userProfiles/${duel.to}/incomingDuels/${duelId}`), updates);
      } else {
        await update(ref(database, `userProfiles/${duel.from}/outgoingDuels/${duelId}`), updates);
      }

      console.log('Duel task completed successfully with proof');
    } catch (error) {
      console.error('Error completing duel task:', error);
      throw error;
    }
  }

  // Get duel tasks for a specific duel
  onDuelTasksChange(duelId: string, callback: (tasks: DuelTask[]) => void) {
    const tasksQuery = query(this.duelTasksRef, orderByChild('duelId'), equalTo(duelId));
    
    const unsubscribe = onValue(tasksQuery, (snapshot) => {
      const tasks: DuelTask[] = [];
      if (snapshot.exists()) {
        const tasksData = snapshot.val();
        Object.keys(tasksData).forEach(key => {
          const task = tasksData[key];
          // Only include tasks for current user
          if (task.userId === this.userId) {
            tasks.push({
              id: key,
              ...task
            });
          }
        });
      }
      callback(tasks);
    });

    return () => off(tasksQuery, 'value', unsubscribe);
  }

  // Remove friend
  async removeFriend(friendId: string): Promise<void> {
    try {
      // Find and remove from current user's friends list
      const friendsSnapshot = await get(this.friendsRef);
      if (friendsSnapshot.exists()) {
        const friends = friendsSnapshot.val();
        for (const id in friends) {
          if (friends[id].friendId === friendId) {
            await remove(ref(database, `userProfiles/${this.userId}/friends/${id}`));
            break;
          }
        }
      }

      // Find and remove from other user's friends list
      const otherFriendsRef = ref(database, `userProfiles/${friendId}/friends`);
      const otherFriendsSnapshot = await get(otherFriendsRef);
      if (otherFriendsSnapshot.exists()) {
        const otherFriends = otherFriendsSnapshot.val();
        for (const id in otherFriends) {
          if (otherFriends[id].friendId === this.userId) {
            await remove(ref(database, `userProfiles/${friendId}/friends/${id}`));
            break;
          }
        }
      }

      console.log('Friend removed successfully');
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }
}