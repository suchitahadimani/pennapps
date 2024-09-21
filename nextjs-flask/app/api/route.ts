// app/api/record/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://localhost:5328/api/record');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in record API route:", error);
    return NextResponse.json({ error: 'Failed to start recording' }, { status: 500 });
  }
}