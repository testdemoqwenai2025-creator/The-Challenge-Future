// Team Management API Routes
// Handles: CRUD for teams, member management, invitations, billing

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { randomUUID } from 'crypto';

// GET /api/teams - List user's teams or get specific team
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (teamId) {
      // Get specific team with members
      const team = await db.team.findUnique({
        where: { id: teamId },
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true, lastLoginAt: true },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          invitations: {
            where: { status: 'pending' },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              members: true,
              applications: true,
            },
          },
        },
      });

      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      // Check if user is a member
      const isMember = team.ownerId === session.user.id || 
                       team.members.some(m => m.userId === session.user.id);
      
      if (!isMember) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      return NextResponse.json({ team });
    } else {
      // List all teams user is a member of
      const memberships = await db.teamMember.findMany({
        where: { userId: session.user.id },
        include: {
          team: {
            include: {
              owner: {
                select: { id: true, name: true, email: true, image: true },
              },
              _count: {
                select: {
                  members: true,
                  applications: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });

      // Also include owned teams (in case owner not in members table)
      const ownedTeams = await db.team.findMany({
        where: { 
          ownerId: session.user.id,
          members: { none: { userId: session.user.id } },
        },
        include: {
          _count: {
            select: { members: true, applications: true },
          },
        },
      });

      const allTeams = [
        ...memberships.map(m => ({ ...m.team, role: m.role })),
        ...ownedTeams.map(t => ({ ...t, role: 'owner' })),
      ];

      return NextResponse.json({ teams: allTeams });
    }

  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, slug, plan = 'team', maxSeats = 10 } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug is available
    const existingTeam = await db.team.findUnique({ where: { slug } });
    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team slug already taken' },
        { status: 409 }
      );
    }

    // Check user's current plan allows team creation
    const userPlan = (session.user as any).plan || 'explorer';
    if (userPlan === 'explorer') {
      return NextResponse.json(
        { error: 'Team features require Pro plan or higher. Please upgrade your subscription.' },
        { status: 403 }
      );
    }

    // Create team
    const team = await db.team.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description,
        ownerId: session.user.id,
        plan,
        maxSeats,
        usedSeats: 1, // Owner counts as one seat
      },
    });

    // Add owner as team member
    await db.teamMember.create({
      data: {
        teamId: team.id,
        userId: session.user.id,
        role: 'owner',
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        teamId: team.id,
        entityType: 'team',
        entityId: team.id,
        action: 'created',
        metadata: { teamName: name },
      },
    });

    return NextResponse.json({ 
      team, 
      message: 'Team created successfully',
      inviteUrl: `${process.env.APP_URL}/invite?token=${randomUUID()}` // Placeholder
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating team:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Team with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}

// PUT /api/teams - Update team settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, name, description, maxSeats, settings } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Verify user is owner or admin
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: { members: { where: { userId: session.user.id } } },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isAdmin = team.ownerId === session.user.id ||
                    team.members.some(m => m.userId === session.user.id && ['owner', 'admin'].includes(m.role));

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only team owners or admins can update team settings' },
        { status: 403 }
      );
    }

    // Update team
    const updatedTeam = await db.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(maxSeats && { maxSeats }),
        ...(settings && { settings }),
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        teamId: teamId,
        entityType: 'team',
        entityId: teamId,
        action: 'updated',
        metadata: { changes: Object.keys(body) },
      },
    });

    return NextResponse.json({ 
      team: updatedTeam, 
      message: 'Team updated successfully' 
    });

  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams - Delete/disband a team
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Only owner can delete team
    const team = await db.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only team owner can delete the team' },
        { status: 403 }
      );
    }

    // Delete team (cascade will handle members, invitations)
    await db.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({ 
      message: 'Team deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
