import { NextResponse } from 'next/server';

const FEEDBACK_TYPES = ['bug', 'suggestie', 'vraag'] as const;
type FeedbackType = (typeof FEEDBACK_TYPES)[number];

const LABEL_MAP: Record<FeedbackType, string> = {
  bug: 'bug',
  suggestie: 'enhancement',
  vraag: 'question',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, type } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Titel is verplicht.' }, { status: 400 });
    }
    if (title.length > 256) {
      return NextResponse.json({ error: 'Titel mag maximaal 256 tekens zijn.' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ error: 'Beschrijving is verplicht.' }, { status: 400 });
    }
    if (description.length > 5000) {
      return NextResponse.json({ error: 'Beschrijving mag maximaal 5000 tekens zijn.' }, { status: 400 });
    }
    if (!FEEDBACK_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Ongeldig feedbacktype.' }, { status: 400 });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('GITHUB_TOKEN is not configured');
      return NextResponse.json({ error: 'Feedback service is niet geconfigureerd.' }, { status: 500 });
    }

    const label = LABEL_MAP[type as FeedbackType];
    const typeLabel = type === 'bug' ? 'Bug' : type === 'suggestie' ? 'Suggestie' : 'Vraag';

    const issueBody = `**Type:** ${typeLabel}\n\n${description.trim()}\n\n---\n_Ingediend via de Ruimtemodel webapp_`;

    const response = await fetch('https://api.github.com/repos/robbertj85/modelruimte/issues', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: title.trim(),
        body: issueBody,
        labels: [label],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('GitHub API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Kon issue niet aanmaken op GitHub.' },
        { status: 502 }
      );
    }

    const issue = await response.json();
    return NextResponse.json({
      success: true,
      issueUrl: issue.html_url,
      issueNumber: issue.number,
    });
  } catch {
    console.error('Feedback route error');
    return NextResponse.json({ error: 'Er ging iets mis.' }, { status: 500 });
  }
}
