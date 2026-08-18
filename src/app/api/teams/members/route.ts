// Team Members & Invitations API
// Handles: Invite members, manage roles, accept/decline invitations

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { randomUUID } from 'crypto';

// POST /api/teams/members - Invite a new member or update member role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, action, email, role, memberId, token } = body;

    switch (action) {
      case 'invite':
        return handleInvitation(teamId, email, role, session);
      
      case 'update-role':
        return handleRoleUpdate(teamId, memberId, role, session);
      
      case 'remove':
        return handleMemberRemoval(teamId, memberId, session);
      
      case 'accept':
        return handleAcceptInvitation(token, session);
      
      case 'decline':
        return handleDeclineInvitation(token, session);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: invite, update-role, remove, accept, decline' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in team members operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform team members operation' },
      { status: 500 }
    );
  }
}

/**
 * Handle inviting a new team member
 */
async function handleInvitation(
  teamId: string,
  email: string,
  role: string,
  session: any
) {
  // Validate inputs
  if (!teamId || !email) {
    return NextResponse.json(
      { error: 'Team ID and email are required' },
      { status: 400 }
    );
  }

  // Check user has permission (owner or admin)
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { 
      members: { where: { userId: session.user.id } },
      _count: { select: { members: true } },
    },
  });

  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  const isOwnerOrAdmin = team.ownerId === session.user.id ||
                         team.members.some(m => m.userId === session.user.id && ['owner', 'admin'].includes(m.role));

  if (!isOwnerOrAdmin) {
    return NextResponse.json(
      { error: 'Only owners and admins can invite members' },
      { status: 403 }
    );
  }

  // Check seat availability
  if (team._count.members >= team.maxSeats) {
    return NextResponse.json(
      { error: `Team has reached maximum seats (${team.maxSeats}). Please upgrade plan for more seats.` },
      { status: 403 }
    );
  }

  // Check if already a member
  const existingMember = await db.teamMember.findFirst({
    where: { 
      teamId, 
      user: { email: email.toLowerCase() }
    },
  });

  if (existingMember) {
    return NextResponse.json(
      { error: 'User is already a team member' },
      { status: 409 }
    );
  }

  // Check for pending invitation
  const pendingInvite = await db.teamInvitation.findFirst({
    where: {
      teamId,
      inviteeEmail: email.toLowerCase(),
      status: 'pending',
    },
  });

  if (pendingInvite) {
    return NextResponse.json(
      { error: 'A pending invitation already exists for this email' },
      { status: 409 }
    );
  }

  // Create invitation
  const invitationToken = randomUUID();
  const invitation = await db.teamInvitation.create({
    data: {
      teamId,
      inviterId: session.user.id,
      inviteeEmail: email.toLowerCase(),
      role: role || 'member',
      token: invitationToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      message: `You've been invited to join ${team.name} on NEXUS`,
    },
  });

  // TODO: Send email notification with invite link
  // For now, just return the invite link
  const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/teams/members?action=accept&token=${invitationToken}`;

  // Log activity
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      teamId,
      entityType: 'team_invitation',
      entityId: invitation.id,
      action: 'invited',
      metadata: { 
        inviteeEmail: email, 
        role: role || 'member' 
      },
    },
  });

  return NextResponse.json({
    invitation: {
      id: invitation.id,
      email: invitation.inviteeEmail,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      inviteUrl,
    },
    message: `Invitation sent to ${email}`,
  }, { status: 201 });
}

/**
 * Handle updating a member's role
 */
async function handleRoleUpdate(
  teamId: string,
  memberId: string,
  newRole: string,
  session: any
) {
  if (!teamId || !memberId || !newRole) {
    return NextResponse.json(
      { error: 'Team ID, member ID, and new role are required' },
      { status: 400 }
    );
  }

  const validRoles = ['owner', 'admin', 'editor', 'viewer'];
  if (!validRoles.includes(newRole)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
      { status: 400 }
    );
  }

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team || team.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: 'Only team owner can change member roles' },
      { status: 403 }
    );
  }

  // Can't demote yourself from owner
  if (memberId === session.user.id && newRole !== 'owner') {
    return NextResponse.json(
      { error: 'Cannot change your own role. Transfer ownership first.' },
      { status: 400 }
    );
  }

  // Update member role
  const updatedMember = await db.teamMember.updateMany({
    where: {
      id: memberId,
      teamId,
    },
    data: { role: newRole },
  });

  if (updatedMember.count === 0) {
    return NextResponse.json(
      { error: 'Member not found in this team' },
      { status: 404 }
    );
  }

  // Log activity
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      teamId,
      entityType: 'team_member',
      entityId: memberId,
      action: 'role_updated',
      metadata: { newRole },
    },
  });

  return NextResponse.json({
    message: 'Member role updated successfully',
    newRole,
  });
}

/**
 * Handle removing a member from team
 */
async function handleMemberRemoval(
  teamId: string,
  memberId: string,
  session: any
) {
  if (!teamId || !memberId) {
    return NextResponse.json(
      { error: 'Team ID and member ID are required' },
      { status: 400 }
    );
  }

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  const isAdmin = team.ownerId === session.user.id ||
                 team.members.some(m => m.userId === session.user.id && ['owner', 'admin'].includes(m.role));

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Only owners and admins can remove members' },
      { status: 403 }
    );
  }

  // Can't remove owner
  const memberToRemove = await db.teamMember.findUnique({
    where: { id: memberId },
  });

  if (!memberToRemove) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  if (memberToRemove.role === 'owner') {
    return NextResponse.json(
      { error: 'Cannot remove team owner. Transfer ownership first.' },
      { status: 400 }
    );
  }

  // Remove member
  await db.teamMember.delete({
    where: { id: memberId },
  });

  // Update used seats count
  await db.team.update({
    where: { id: teamId },
    data: { usedSeats: { decrement: 1 } },
  });

  // Log activity
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      teamId,
      entityType: 'team_member',
      entityId: memberId,
      action: 'removed',
    },
  });

  return NextResponse.json({
    message: 'Member removed from team successfully',
  });
}

/**
 * Handle accepting an invitation
 */
async function handleAcceptInvitation(token: string, session: any) {
  if (!token) {
    return NextResponse.json(
      { error: 'Invitation token is required' },
      { status: 400 }
    );
  }

  if (!session?.user) {
    return NextResponse.json(
      { error: 'You must be logged in to accept an invitation' },
      { status: 401 }
    );
  }

  // Find valid invitation
  const invitation = await db.teamInvitation.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invalid invitation token' },
      { status: 404 }
    );
  }

  if (invitation.status !== 'pending') {
    return NextResponse.json(
      { error: `This invitation has already been ${invitation.status}` },
      { status: 410 }
    );
  }

  if (new Date() > invitation.expiresAt) {
    // Mark as expired
    await db.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'expired' },
    });
    
    return NextResponse.json(
      { error: 'This invitation has expired' },
      { status: 410 }
    );
  }

  // Check seat availability
  const team = await db.team.findUnique({
    where: { id: invitation.teamId },
    include: { _count: { select: { members: true } } },
  });

  if (!team || team._count.members >= team.maxSeats) {
    return NextResponse.json(
      { error: 'This team has reached its maximum capacity' },
      { status: 403 }
    );
  }

  // Accept invitation in transaction
  await db.$transaction([
    // Update invitation status
    db.teamInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        respondedAt: new Date(),
        inviteeId: session.user.id,
      },
    }),
    // Add as team member
    db.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: session.user.id,
        role: invitation.role,
      },
    }),
    // Update used seats
    db.team.update({
      where: { id: invitation.teamId },
      data: { usedSeats: { increment: 1 } },
    }),
  ]);

  // Log activity
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      teamId: invitation.teamId,
      entityType: 'team_invitation',
      entityId: invitation.id,
      action: 'accepted',
      metadata: { teamName: invitation.team.name },
    },
  });

  return NextResponse.json({
    message: `Successfully joined ${invitation.team.name}`,
    team: {
      id: team.id,
      name: team.name,
      slug: team.slug,
      role: invitation.role,
    },
  });
}

/**
 * Handle declining an invitation
 */
async function handleDeclineInvitation(token: string, session: any) {
  if (!token) {
    return NextResponse.json(
      { error: 'Invitation token is required' },
      { status: 400 }
    );
  }

  const invitation = await db.teamInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invalid invitation token' },
      { status: 404 }
    );
  }

  if (invitation.status !== 'pending') {
    return NextResponse.json(
      { error: `This invitation has already been ${invitation.status}` },
      { status: 410 }
    );
  }

  // Decline invitation
  await db.teamInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'declined',
      respondedAt: new Date(),
    },
  });

  // Log activity (if user is logged in)
  if (session?.user) {
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        entityType: 'team_invitation',
        entityId: invitation.id,
        action: 'declined',
      },
    });
  }

  return NextResponse.json({
    message: 'Invitation declined',
  });
}

// GET /api/teams/members - List pending invitations for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'invitations') {
      // Get pending invitations for current user
      const invitations = await db.teamInvitation.findMany({
        where: {
          OR: [
            { inviteeEmail: session.user.email, status: 'pending' },
            { inviteeId: session.user.id, status: 'pending' },
          ],
        },
        include: {
          team: {
            select: { id: true, name: true, slug: true, image: true },
          },
          inviter: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ invitations });
    }

    // Default: get team members for a specific team
    const teamId = searchParams.get('teamId');
    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId parameter is required' },
        { status: 400 }
      );
    }

    const members = await db.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            lastLoginAt: true,
            isActive: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json({ members });

  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
