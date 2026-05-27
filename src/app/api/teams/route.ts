import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

function getDb() {
    return new Database(path.join(process.cwd(), 'prisma', 'dev.db'));
}

function cuid() {
    return crypto.randomBytes(16).toString('hex').substring(0, 25);
}

export async function GET(req: NextRequest) {
    const db = getDb();
    try {
        const { searchParams } = new URL(req.url);
        const team = searchParams.get('team');
        const search = searchParams.get('search');

        let query = 'SELECT * FROM TeamMember';
        const conditions: string[] = [];
        const params: any[] = [];

        if (team) {
            conditions.push('team = ?');
            params.push(team);
        }

        if (search) {
            conditions.push('(name LIKE ? OR cedula LIKE ? OR email LIKE ? OR position LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY createdAt DESC';

        const members = db.prepare(query).all(...params);
        db.close();
        return NextResponse.json(members);
    } catch (error) {
        db.close();
        console.error('Teams API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const db = getDb();
    try {
        const data = await req.json();
        const id = cuid();
        const now = new Date().toISOString();

        const stmt = db.prepare(`
            INSERT INTO TeamMember (id, team, name, cedula, position, startDate, increaseDue, email, leader, salary, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            data.team,
            data.name,
            data.cedula,
            data.position,
            data.startDate,
            data.increaseDue || null,
            data.email,
            data.leader,
            data.salary,
            now,
            now
        );

        const member = db.prepare('SELECT * FROM TeamMember WHERE id = ?').get(id);
        db.close();
        return NextResponse.json(member, { status: 201 });
    } catch (error) {
        db.close();
        console.error('Teams API Error:', error);
        return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const db = getDb();
    try {
        const data = await req.json();
        const { id, ...updates } = data;

        if (!id) {
            db.close();
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const setClauses: string[] = [];
        const params: any[] = [];

        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                setClauses.push(`${key} = ?`);
                params.push(value === '' ? null : value);
            }
        }

        setClauses.push('updatedAt = ?');
        params.push(new Date().toISOString());
        params.push(id);

        db.prepare(`UPDATE TeamMember SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
        const member = db.prepare('SELECT * FROM TeamMember WHERE id = ?').get(id);
        db.close();
        return NextResponse.json(member);
    } catch (error) {
        db.close();
        console.error('Teams API Error:', error);
        return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        db.close();
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        db.prepare('DELETE FROM TeamMember WHERE id = ?').run(id);
        db.close();
        return NextResponse.json({ message: 'Team member removed' });
    } catch (error) {
        db.close();
        console.error('Teams API Error:', error);
        return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
    }
}
