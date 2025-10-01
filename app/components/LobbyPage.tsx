"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import HowToPlayModal from "./HowToPlayModal";

interface LobbyPageProps {
  onCreateRoom: (username: string, rounds: number) => void;
  onJoinRoom: (username: string, roomCode: string) => void;
  isLoading?: boolean;
}

const LobbyPage: React.FC<LobbyPageProps> = ({
  onCreateRoom,
  onJoinRoom,
  isLoading = false,
}) => {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [rounds, setRounds] = useState([5]);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }
    if (username.trim().length < 2) {
      alert("Username must be at least 2 characters long");
      return;
    }
    if (username.trim().length > 20) {
      alert("Username must be 20 characters or less");
      return;
    }

    onCreateRoom(username.trim(), rounds[0]);
  };

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }
    if (!roomCode.trim()) {
      alert("Please enter a room code");
      return;
    }
    if (roomCode.trim().length !== 6) {
      alert("Room code must be 6 characters long");
      return;
    }

    onJoinRoom(username.trim(), roomCode.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Game Title */}
        <div className="text-center mb-8">
          <h1
            className="text-6xl font-bold text-white mb-4 tracking-wider"
            style={{
              textShadow:
                "0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3)",
              fontFamily: "monospace",
            }}
          >
            WAVELENGTH
          </h1>
          <p className="text-white/80 text-lg">The telepathic party game</p>
        </div>

        {/* Main Lobby Card */}
        <Card className="bg-slate-800/50 border-white/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Join a Game</CardTitle>
            <CardDescription className="text-white/70">
              Enter your username and either create a new room or join an
              existing one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-700/50 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400"
                maxLength={20}
              />
            </div>

            {/* Create/Join Tabs */}
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                <TabsTrigger
                  value="create"
                  className="text-white data-[state=active]:bg-blue-600"
                >
                  Create Room
                </TabsTrigger>
                <TabsTrigger
                  value="join"
                  className="text-white data-[state=active]:bg-blue-600"
                >
                  Join Room
                </TabsTrigger>
              </TabsList>

              {/* Create Room Tab */}
              <TabsContent value="create" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <Label htmlFor="rounds" className="text-white font-medium">
                    Number of Rounds: {rounds[0]}
                  </Label>
                  <div className="px-2">
                    <Slider
                      value={rounds}
                      onValueChange={setRounds}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCreateRoom}
                  disabled={isLoading || !username.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                >
                  {isLoading ? "Creating Room..." : "Create Room"}
                </Button>
              </TabsContent>

              {/* Join Room Tab */}
              <TabsContent value="join" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="roomCode" className="text-white font-medium">
                    Room Code
                  </Label>
                  <Input
                    id="roomCode"
                    type="text"
                    placeholder="Enter room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="bg-slate-700/50 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 text-center text-lg font-mono tracking-wider"
                    maxLength={6}
                  />
                  <p className="text-xs text-white/60 text-center">
                    Ask the room creator for the 6-character code
                  </p>
                </div>

                <Button
                  onClick={handleJoinRoom}
                  disabled={isLoading || !username.trim() || !roomCode.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3"
                >
                  {isLoading ? "Joining Room..." : "Join Room"}
                </Button>
              </TabsContent>
            </Tabs>

            {/* Game Rules Link */}
            <div className="text-center pt-4 border-t border-white/20">
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setIsHowToPlayOpen(true)}
              >
                How to Play
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-white/60 text-sm">
          <p>Built with Next.js & Convex</p>
        </div>
      </div>

      {/* How to Play Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
};

export default LobbyPage;
