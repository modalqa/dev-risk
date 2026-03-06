import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/leads - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, jobTitle, phone, message } = body;

    if (!name || !email || !company) {
      return NextResponse.json(
        { error: 'Name, email, and company are required' },
        { status: 400 }
      );
    }

    // Check if lead already exists with same email
    const existingLead = await prisma.lead.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingLead) {
      return NextResponse.json(
        { error: 'A demo request with this email already exists' },
        { status: 409 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        company: company.trim(),
        jobTitle: jobTitle?.trim() || null,
        phone: phone?.trim() || null,
        message: message?.trim() || null,
        status: 'NEW',
        source: 'website',
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        lead: { 
          id: lead.id, 
          name: lead.name, 
          email: lead.email, 
          company: lead.company 
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Leads POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}