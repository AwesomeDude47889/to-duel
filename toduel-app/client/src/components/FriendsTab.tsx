import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { FirebaseFriendsManager, Friend, FriendRequest, Duel } from '../lib/firebaseFriends';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { DuelTasksTab } from './DuelTasksTab';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { useToast } from '../hooks/use-toast';
import { Users, UserPlus, Swords, Trophy, Clock, Star, Plus, X, Target, Trash2 } from 'lucide-react';

interface FriendsTabProps {
  userProfile: any;
}

export function FriendsTab({ userProfile }: FriendsTabProps) {
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  const [friendsManager, setFriendsManager] = useState<FirebaseFriendsManager | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duelForm, setDuelForm] = useState({
    taskCount: 3,
    xpStake: 10,
    hoursDeadline: 24
  });
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showDuelModal, setShowDuelModal] = useState(false);
  const [customTasks, setCustomTasks] = useState<string[]>(['']);
  const [duelStake, setDuelStake] = useState(10);
  const [duelHours, setDuelHours] = useState(24);
  const [selectedDuel, setSelectedDuel] = useState<Duel | null>(null);
  const [activeSubTab, setActiveSubTab] = useState('friends');

  // Initialize friends manager
  useEffect(() => {
    if (user?.uid) {
      const manager = new FirebaseFriendsManager(user.uid);
      setFriendsManager(manager);

      // Subscribe to friends changes with error handling
      const unsubscribeFriends = manager.onFriendsChange((friends) => {
        console.log('Friends updated:', friends);
        setFriends(friends);
      });
      
      const unsubscribeRequests = manager.onFriendRequestsChange((requests) => {
        console.log('Friend requests updated:', requests);
        setFriendRequests(requests);
      });
      
      const unsubscribeDuels = manager.onDuelsChange((duels) => {
        console.log('Duels updated:', duels);
        setDuels(duels);
      });

      return () => {
        unsubscribeFriends();
        unsubscribeRequests();
        unsubscribeDuels();
      };
    }
  }, [user]);

  const handleSearchUser = async () => {
    if (!friendsManager || !searchEmail.trim()) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearching(true);
      const foundUser = await friendsManager.searchUserByEmail(searchEmail.trim());
      
      if (foundUser) {
        await friendsManager.sendFriendRequest(foundUser.id, foundUser.email, foundUser.displayName);
        toast({
          title: "Friend Request Sent! 📤",
          description: `Request sent to ${foundUser.displayName}`,
        });
        setSearchEmail('');
      } else {
        toast({
          title: "User Not Found",
          description: "No user found with that email address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send friend request",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!friendsManager) return;

    try {
      setIsLoading(true);
      await friendsManager.acceptFriendRequest(request.id, request.fromId, request.fromEmail, request.fromDisplayName);
      toast({
        title: "Friend Added! 🎉",
        description: `${request.fromDisplayName} is now your friend`,
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!friendsManager) return;

    try {
      setIsLoading(true);
      await friendsManager.rejectFriendRequest(requestId);
      toast({
        title: "Request Rejected",
        description: "Friend request has been declined",
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChallengeFriend = async (friend: Friend) => {
    if (!friendsManager) return;
    setSelectedFriend(friend);
    setShowDuelModal(true);
  };

  const addTaskField = () => {
    if (customTasks.length < 10) {
      setCustomTasks([...customTasks, '']);
    }
  };

  const removeTaskField = (index: number) => {
    if (customTasks.length > 1) {
      const newTasks = customTasks.filter((_, i) => i !== index);
      setCustomTasks(newTasks);
    }
  };

  const updateTask = (index: number, value: string) => {
    const newTasks = [...customTasks];
    newTasks[index] = value;
    setCustomTasks(newTasks);
  };

  const sendDuelChallenge = async () => {
    if (!friendsManager || !selectedFriend) return;

    try {
      setIsLoading(true);
      
      // Filter out empty tasks
      const validTasks = customTasks.filter(task => task.trim().length > 0);
      
      if (validTasks.length === 0) {
        toast({
          title: "No Tasks",
          description: "Please add at least one task description.",
          variant: "destructive",
        });
        return;
      }

      await friendsManager.challengeFriend(
        selectedFriend.friendId,
        selectedFriend.email,
        selectedFriend.displayName,
        validTasks,
        duelStake,
        duelHours
      );

      toast({
        title: "Duel Challenge Sent! ⚔️",
        description: `Challenge sent to ${selectedFriend.displayName}`,
      });

      // Reset form
      setShowDuelModal(false);
      setCustomTasks(['']);
      setDuelStake(10);
      setDuelHours(24);
      setSelectedFriend(null);
    } catch (error) {
      console.error('Error challenging friend:', error);
      toast({
        title: "Challenge Failed",
        description: error instanceof Error ? error.message : "Failed to send duel challenge",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptDuel = async (duel: Duel) => {
    if (!friendsManager) return;

    try {
      setIsLoading(true);
      await friendsManager.acceptDuel(duel.id);
      toast({
        title: "Duel Accepted! ⚔️",
        description: `Ready to duel ${duel.fromDisplayName}! Tasks have been added to your list.`,
      });
    } catch (error: any) {
      // Only show errors for actual failures, not operational successes
      if (error.message && !error.message.includes('successfully')) {
        console.error('Error accepting duel:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to accept duel",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectDuel = async (duelId: string) => {
    if (!friendsManager) return;

    try {
      setIsLoading(true);
      await friendsManager.rejectDuel(duelId);
      const duel = duels.find(d => d.id === duelId);
      const opponentName = duel?.fromDisplayName || 'Unknown';
      toast({
        title: "Duel Declined",
        description: `You declined the duel from ${opponentName}.`,
      });
    } catch (error) {
      console.error('Error rejecting duel:', error);
      toast({
        title: "Error",
        description: "Failed to reject duel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleForfeitDuel = async (duel: Duel) => {
    if (!friendsManager) return;

    try {
      setIsLoading(true);
      await friendsManager.forfeitDuel(duel.id);
      const opponentName = duel.from === user?.uid ? duel.toDisplayName : duel.fromDisplayName;
      toast({
        title: "Duel Forfeited 🏳️",
        description: `You forfeited the duel. ${opponentName} wins and earns all XP.`,
      });
    } catch (error) {
      console.error('Error forfeiting duel:', error);
      toast({
        title: "Error",
        description: "Failed to forfeit duel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDuelStatusBadge = (duel: Duel) => {
    const isChallenger = duel.challengerId === user?.uid;
    const progress = isChallenger ? duel.challengerProgress : duel.challengedProgress;
    const opponentProgress = isChallenger ? duel.challengedProgress : duel.challengerProgress;

    switch (duel.status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'active':
        return <Badge className="bg-blue-500">{progress}/{duel.taskCount} Complete</Badge>;
      case 'completed':
        const isWinner = duel.winnerId === user?.uid;
        return <Badge className={isWinner ? "bg-green-500" : "bg-red-500"}>
          {isWinner ? "Won! 🏆" : "Lost"}
        </Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{duel.status}</Badge>;
    }
  };

  const getTimeRemaining = (deadline: number) => {
    const now = Date.now();
    const remaining = deadline - now;
    
    if (remaining <= 0) return "Expired";
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  if (!user) {
    return <div className="text-center py-8">Please log in to view friends</div>;
  }

  // Debug info
  console.log('Current user:', user.uid, user.email);

  // Show DuelTasksTab if a duel is selected
  if (activeSubTab === 'duel-tasks' && selectedDuel) {
    return (
      <DuelTasksTab 
        duel={selectedDuel} 
        onBack={() => {
          setActiveSubTab('duels');
          setSelectedDuel(null);
        }} 
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between py-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Friends & Duels
          </h2>
          <p className="text-muted-foreground text-lg">Challenge your friends to productivity duels</p>
        </div>
        <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{friends.length} friends</span>
        </div>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <TabsTrigger value="friends" className="flex items-center space-x-2 py-3 px-4 rounded-lg transition-all">
            <Users className="h-4 w-4" />
            <span className="font-medium">Friends</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center space-x-2 py-3 px-4 rounded-lg transition-all">
            <UserPlus className="h-4 w-4" />
            <span className="font-medium">Requests</span>
            {friendRequests.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {friendRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="duels" className="flex items-center space-x-2 py-3 px-4 rounded-lg transition-all">
            <Swords className="h-4 w-4" />
            <span className="font-medium">Duels</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-6 mt-6">
          {/* Add Friend Section */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <div className="p-2 rounded-lg bg-blue-500 mr-3">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                Add Friend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3">
                <Input
                  placeholder="Enter friend's email address"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                  type="email"
                  className="flex-1 h-12 border-2 border-blue-200 dark:border-blue-700 rounded-xl focus:border-blue-500 transition-colors"
                />
                <Button 
                  onClick={handleSearchUser} 
                  disabled={isSearching || !searchEmail.trim()}
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all hover:scale-105"
                >
                  {isSearching ? 'Searching...' : 'Send Request'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Friends List */}
          <div className="grid gap-6">
            {friends.map((friend) => (
              <Card key={friend.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-lg">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{friend.displayName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{friend.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => handleChallengeFriend(friend)}
                      className="h-11 px-6 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20 transition-all hover:scale-105 font-medium rounded-xl"
                    >
                      <Swords className="h-4 w-4 mr-2" />
                      Challenge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {friends.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No friends yet. Add some friends to start dueling!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {friendRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{request.fromDisplayName}</p>
                    <p className="text-sm text-muted-foreground">{request.fromEmail}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={() => handleAcceptRequest(request)} 
                    disabled={isLoading}
                    size="sm"
                  >
                    Accept
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleRejectRequest(request.id)} 
                    disabled={isLoading}
                    size="sm"
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {friendRequests.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending friend requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="duels" className="space-y-6 mt-6">
          {duels.filter(duel => duel.status === 'pending' || duel.status === 'active').map((duel) => {
            const isChallenger = duel.from === user?.uid;
            const opponent = isChallenger ? duel.toDisplayName : duel.fromDisplayName;
            const progress = isChallenger ? duel.challengerProgress : duel.challengedProgress;
            const opponentProgress = isChallenger ? duel.challengedProgress : duel.challengerProgress;

            return (
              <Card key={duel.id} className="group relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <Swords className="h-7 w-7 text-white" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                          {isChallenger ? `Challenge to ${opponent}` : `Challenge from ${opponent}`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          {duel.tasks?.length || 0} tasks • {duel.stakeXP} XP stake
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getDuelStatusBadge(duel)}
                      {duel.status === 'active' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {getTimeRemaining(new Date(duel.deadline).getTime())}
                        </p>
                      )}
                    </div>
                  </div>

                  {duel.status === 'pending' && !isChallenger && (
                    <div className="group-hover:flex hidden space-x-2 absolute top-4 right-4">
                      <Button 
                        onClick={() => handleAcceptDuel(duel)} 
                        disabled={isLoading}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleRejectDuel(duel.id)} 
                        disabled={isLoading}
                        size="sm"
                        className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  {duel.status === 'active' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Your Progress:</span>
                        <span className="font-medium">{progress}/{duel.tasks?.length || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(progress / (duel.tasks?.length || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{opponent}'s Progress:</span>
                        <span>{opponentProgress}/{duel.tasks?.length || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(opponentProgress / (duel.tasks?.length || 1)) * 100}%` }}
                        />
                      </div>
                      
                      {/* Hover actions for active duels */}
                      <div className="group-hover:flex hidden space-x-2 justify-end pt-2">
                        <Button 
                          onClick={() => {
                            setSelectedDuel(duel);
                            setActiveSubTab('duel-tasks');
                          }}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View Tasks
                        </Button>
                        <Button 
                          onClick={() => handleForfeitDuel(duel)}
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50 hover:scale-105 transition-transform"
                        >
                          🏳️ Forfeit
                        </Button>
                      </div>
                    </div>
                  )}

                  {duel.status === 'completed' && (
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">
                        {duel.winnerId === user?.uid ? 'You won!' : `${opponent} won!`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {duels.filter(duel => duel.status === 'pending' || duel.status === 'active').length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No duels yet. Challenge your friends to get started!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Custom Duel Challenge Modal */}
      <Dialog open={showDuelModal} onOpenChange={setShowDuelModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Swords className="h-5 w-5" />
              <span>Challenge {selectedFriend?.displayName}</span>
            </DialogTitle>
            <DialogDescription>
              Create a custom duel challenge with tasks, XP stakes, and deadline
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Task Management Section */}
            <div>
              <Label className="text-base font-semibold">Custom Tasks (1-10)</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Create shared tasks that both you and your opponent must complete to win
              </p>
              
              <div className="space-y-3">
                {customTasks.map((task, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Textarea
                        placeholder={`Task ${index + 1} description...`}
                        value={task}
                        onChange={(e) => updateTask(index, e.target.value)}
                        className="min-h-[60px] resize-none"
                      />
                    </div>
                    {customTasks.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTaskField(index)}
                        className="p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {customTasks.length < 10 && (
                  <Button
                    variant="outline"
                    onClick={addTaskField}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task ({customTasks.length}/10)
                  </Button>
                )}
              </div>
            </div>

            {/* XP Stake Section */}
            <div>
              <Label htmlFor="xpStake" className="text-base font-semibold">XP Stake</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Minimum 10 XP • You have {userProfile?.totalXP || 0} total XP • Winner takes all
              </p>
              <Input
                id="xpStake"
                type="number"
                min="10"
                max={userProfile?.totalXP || 0}
                value={duelStake}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 10;
                  setDuelStake(Math.max(10, Math.min(value, userProfile?.totalXP || 0)));
                }}
                placeholder="Enter XP amount to stake"
                className="w-full"
              />
              {duelStake > (userProfile?.totalXP || 0) && (
                <p className="text-sm text-red-500 mt-1">
                  Insufficient XP! You only have {userProfile?.totalXP || 0} XP
                </p>
              )}
            </div>

            {/* Duration Section */}
            <div>
              <Label htmlFor="duration" className="text-base font-semibold">Deadline</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Maximum 72 hours from now
              </p>
              <Select value={duelHours.toString()} onValueChange={(value) => setDuelHours(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 Hours</SelectItem>
                  <SelectItem value="12">12 Hours</SelectItem>
                  <SelectItem value="24">24 Hours</SelectItem>
                  <SelectItem value="48">48 Hours</SelectItem>
                  <SelectItem value="72">72 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary Section */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Duel Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Tasks:</span>
                  <span>{customTasks.filter(t => t.trim()).length} custom tasks</span>
                </div>
                <div className="flex justify-between">
                  <span>XP Stake:</span>
                  <span>{duelStake} XP</span>
                </div>
                <div className="flex justify-between">
                  <span>Deadline:</span>
                  <span>{duelHours} hours</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDuelModal(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={sendDuelChallenge}
                disabled={
                  isLoading || 
                  customTasks.filter(t => t.trim()).length === 0 ||
                  duelStake < 10 ||
                  duelStake > (userProfile?.totalXP || 0)
                }
                className="flex-1"
              >
                <Swords className="h-4 w-4 mr-2" />
                Send Challenge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}