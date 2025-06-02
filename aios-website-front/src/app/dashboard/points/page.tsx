import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Coins, PlayCircle } from "lucide-react";

export default function PointsPage() {
  return (
    <>
      <Navbar />
      <div className="container px-4 pt-24 mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Total Points Used"
            value="12,485"
            className="bg-primary/5"
          />
          <StatCard
            title="Points Remaining"
            value="3,515"
            className="bg-secondary/5"
          />
          <StatCard
            title="Total Conversations"
            value="42"
            className="bg-blue-500/5"
          />
          <StatCard
            title="Avg. Points per Conversation"
            value="297"
            className="bg-purple-500/5"
          />
        </div>

        {/* Points History Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Points History</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search conversations..."
                className="px-4 py-2 border rounded-md bg-secondary/10 border-secondary/20"
              />
              <select className="px-4 py-2 border rounded-md bg-secondary/10 border-secondary/20">
                <option>All Conversations</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conversation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Points Used</TableHead>
                <TableHead>Tools Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">Agricultural Tractor Design</div>
                    <div className="text-sm text-muted-foreground">We need to optimize the battery configuration for rural environments...</div>
                  </div>
                </TableCell>
                <TableCell>Today, 14:32</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    842 points
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs text-blue-500 rounded-full bg-blue-500/10">Filesystem</span>
                    <span className="px-2 py-1 text-xs text-purple-500 rounded-full bg-purple-500/10">Playwright</span>
                    <span className="px-2 py-1 text-xs text-green-500 rounded-full bg-green-500/10">+2</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-md hover:bg-secondary/20">
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
              {/* Add more rows as needed */}
            </TableBody>
          </Table>

          <div className="flex justify-center gap-2 mt-6">
            <button className="px-3 py-1 rounded-md bg-secondary/10 hover:bg-secondary/20">&lt;</button>
            <button className="px-3 py-1 text-white bg-blue-500 rounded-md">1</button>
            <button className="px-3 py-1 rounded-md bg-secondary/10 hover:bg-secondary/20">2</button>
            <button className="px-3 py-1 rounded-md bg-secondary/10 hover:bg-secondary/20">3</button>
            <button className="px-3 py-1 rounded-md bg-secondary/10 hover:bg-secondary/20">...</button>
            <button className="px-3 py-1 rounded-md bg-secondary/10 hover:bg-secondary/20">7</button>
            <button className="px-3 py-1 rounded-md bg-secondary/10 hover:bg-secondary/20">&gt;</button>
          </div>
        </Card>
      </div>
    </>
  );
}

function StatCard({ title, value, className = "" }: { title: string, value: string, className?: string }) {
  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-sm text-muted-foreground">{title}</h3>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
} 