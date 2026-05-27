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

export async function POST(req: NextRequest) {
    const db = getDb();
    try {
        const { members } = await req.json();

        if (!Array.isArray(members) || members.length === 0) {
            db.close();
            return NextResponse.json({ error: 'No members provided' }, { status: 400 });
        }

        const stmt = db.prepare(`
            INSERT INTO TeamMember (id, team, name, cedula, position, startDate, increaseDue, email, leader, salary, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const now = new Date().toISOString();
        let inserted = 0;
        let skipped = 0;

        const insertMany = db.transaction((rows: any[]) => {
            for (const row of rows) {
                if (!row.name || !row.name.trim()) {
                    skipped++;
                    continue;
                }
                stmt.run(
                    cuid(),
                    row.team || 'Developers',
                    row.name.trim(),
                    (row.cedula || '').toString().trim(),
                    (row.position || '').trim(),
                    (row.startDate || '').toString().trim(),
                    row.increaseDue ? row.increaseDue.toString().trim() : null,
                    (row.email || '').trim(),
                    (row.leader || '').trim(),
                    (row.salary || '').toString().trim(),
                    now,
                    now
                );
                inserted++;
            }
        });

        insertMany(members);
        db.close();

        return NextResponse.json({ inserted, skipped, total: members.length });
    } catch (error) {
        db.close();
        console.error('Bulk Teams API Error:', error);
        return NextResponse.json({ error: 'Failed to bulk import team members' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const db = getDb();
    try {
        const { ids } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            db.close();
            return NextResponse.json({ error: 'No IDs provided for deletion' }, { status: 400 });
        }

        const stmt = db.prepare('DELETE FROM TeamMember WHERE id = ?');
        let deleted = 0;

        const deleteMany = db.transaction((idList: string[]) => {
            for (const id of idList) {
                const result = stmt.run(id);
                if (result.changes > 0) deleted++;
            }
        });

        deleteMany(ids);
        db.close();

        return NextResponse.json({ deleted, total: ids.length });
    } catch (error) {
        db.close();
        console.error('Bulk Delete API Error:', error);
        return NextResponse.json({ error: 'Failed to bulk delete members' }, { status: 500 });
    }
}
