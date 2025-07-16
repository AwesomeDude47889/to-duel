import { useState, useEffect } from 'react';
import { Duel, FirebaseFriendsManager } from '../lib/firebaseFriends';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ArrowLeft, Clock, Trophy, CheckCircle, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';

interface DuelTasksTabProps {
  duel: Duel;
  onBack: () => void;
}

export function DuelTasksTab({ duel, onBack }: DuelTasksTabProps) {
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  const [proofText, setProofText] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [friendsManager, setFriendsManager] = useState<FirebaseFriendsManager | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const manager = new FirebaseFriendsManager(user.uid);
      setFriendsManager(manager);
    }
  }, [user]);

  const getTimeRemaining = (deadline: string) => {
    const remaining = new Date(deadline).getTime() - Date.now();
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  const handleSubmitProof = async () => {
    if (!proofText.trim() && !proofFile) {
      toast({
        title: "Missing Proof",
        description: "Please provide text proof or upload a file.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTaskIndex === null || !friendsManager) return;

    try {
      setIsSubmitting(true);
      
      const proof = {
        text: proofText,
        imageURL: proofFile ? URL.createObjectURL(proofFile) : undefined
      };

      await friendsManager.completeDuelTask(duel.id, selectedTaskIndex, proof);
      
      toast({
        title: "Proof Submitted! ✅",
        description: "Your task completion proof has been submitted.",
      });
      
      setProofText('');
      setProofFile(null);
      setSelectedTaskIndex(null);
    } catch (error) {
      console.error('Error submitting proof:', error);
      toast({
        title: "Error",
        description: "Failed to submit proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isChallenger = duel.from === user?.uid;
  const opponent = isChallenger ? duel.toDisplayName : duel.fromDisplayName;
  const myProgress = isChallenger ? duel.challengerProgress : duel.challengedProgress;
  const opponentProgress = isChallenger ? duel.challengedProgress : duel.challengerProgress;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Duels
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Duel vs {opponent}</h2>
            <p className="text-muted-foreground">Complete tasks to win the duel</p>
          </div>
        </div>
        <Badge variant={duel.status === 'active' ? 'default' : 'secondary'}>
          {duel.status}
        </Badge>
      </div>

      {/* Duel Status */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{myProgress}</div>
              <p className="text-sm text-muted-foreground">Your Progress</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{duel.stakeXP} XP</div>
              <p className="text-sm text-muted-foreground">Stakes</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{opponentProgress}</div>
              <p className="text-sm text-muted-foreground">{opponent}'s Progress</p>
            </div>
          </div>
          
          {duel.status === 'active' && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                {getTimeRemaining(duel.deadline)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Duel Tasks</h3>
        {duel.tasks?.map((task, index) => {
          const isCompleted = isChallenger ? task.completedByChallenger : task.completedByChallenged;
          const opponentCompleted = isChallenger ? task.completedByChallenged : task.completedByChallenger;
          
          return (
            <Card key={index} className={`border-l-4 ${isCompleted ? 'border-l-green-500 bg-green-50 dark:bg-green-950' : 'border-l-blue-500'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">{task.description}</span>
                      {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {opponentCompleted && <Badge variant="outline" className="text-xs">Opponent completed</Badge>}
                    </div>
                    
                    {isCompleted && (isChallenger ? task.proofChallenger : task.proofChallenged) && (
                      <div className="text-sm text-muted-foreground mt-2">
                        <strong>Your proof:</strong> {isChallenger ? task.proofChallenger : task.proofChallenged}
                      </div>
                    )}
                  </div>
                  
                  {!isCompleted && duel.status === 'active' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedTaskIndex(index)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Proof
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Submit Task Proof</DialogTitle>
                          <DialogDescription>
                            Provide evidence that you completed this task
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="proof-text">Describe how you completed this task</Label>
                            <Textarea
                              id="proof-text"
                              placeholder="Explain what you did to complete this task..."
                              value={proofText}
                              onChange={(e) => setProofText(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="proof-file">Upload proof image (optional)</Label>
                            <Input
                              id="proof-file"
                              type="file"
                              accept="image/*"
                              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setSelectedTaskIndex(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSubmitProof} disabled={isSubmitting}>
                              {isSubmitting ? 'Submitting...' : 'Submit Proof'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}