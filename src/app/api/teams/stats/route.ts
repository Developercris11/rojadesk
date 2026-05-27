import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
    return new Database(path.join(process.cwd(), 'prisma', 'dev.db'));
}

export async function GET() {
    const db = getDb();
    try {
        const members = db.prepare('SELECT team, leader, salary FROM TeamMember').all() as {
            team: string;
            leader: string;
            salary: string;
        }[];

        // Group by team
        const teamStats: Record<string, { count: number; leader: string; totalSalary: number }> = {};

        for (const member of members) {
            if (!teamStats[member.team]) {
                teamStats[member.team] = { count: 0, leader: member.leader, totalSalary: 0 };
            }
            teamStats[member.team].count += 1;
            const salaryNum = parseFloat(member.salary.replace(/[$,]/g, '')) || 0;
            teamStats[member.team].totalSalary += salaryNum;
        }

        const totalMembers = members.length;
        const uniqueTeams = Object.keys(teamStats).length;

        db.close();
        return NextResponse.json({
            totalMembers,
            uniqueTeams,
            teams: teamStats,
        });
    } catch (error) {
        db.close();
        console.error('Teams Stats API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch team stats' }, { status: 500 });
    }
}
