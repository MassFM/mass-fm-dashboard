import { NextResponse } from 'next/server';

const WP_API_URL = 'https://khotbahjumat.com/wp-json/wp/v2/posts';

interface WPPost {
  id: number;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  _embedded?: {
    author?: Array<{ name: string }>;
    'wp:featuredmedia'?: Array<{ source_url: string }>;
    'wp:term'?: Array<Array<{ name: string }>>;
  };
}

/** Strip HTML entities & tags dari judul WP */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * POST — Fetch posts dari WordPress, return data siap upsert
 * Supabase upsert dilakukan di client (authenticated session)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const page = body.page || 1;
    const perPage = body.per_page || 20;

    const wpUrl = `${WP_API_URL}?per_page=${perPage}&page=${page}&_embed&orderby=date&order=desc`;

    // Fetch posts dari WordPress REST API (server-side, no CORS)
    const wpRes = await fetch(wpUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MassFM-Dashboard/1.0)',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!wpRes.ok) {
      const errorBody = await wpRes.text().catch(() => '');
      return NextResponse.json(
        { error: `WordPress API error: ${wpRes.status} ${wpRes.statusText}`, detail: errorBody.substring(0, 300) },
        { status: 502 }
      );
    }

    // Pastikan response berupa JSON (bukan HTML dari Cloudflare)
    const contentType = wpRes.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const htmlBody = await wpRes.text().catch(() => '');
      return NextResponse.json(
        { error: `Response bukan JSON (${contentType})`, detail: htmlBody.substring(0, 300) },
        { status: 502 }
      );
    }

    let posts: WPPost[];
    try {
      posts = await wpRes.json();
    } catch {
      return NextResponse.json(
        { error: 'Gagal parse response JSON dari WordPress' },
        { status: 502 }
      );
    }

    const totalPages = parseInt(wpRes.headers.get('X-WP-TotalPages') || '1');
    const totalPosts = parseInt(wpRes.headers.get('X-WP-Total') || String(posts.length));

    if (!Array.isArray(posts) || !posts.length) {
      return NextResponse.json({
        rows: [],
        total_wp: totalPosts,
        total_pages: totalPages,
      });
    }

    // Map WP posts ke format pending_materials
    const rows = posts.map((post) => {
      const authorName = post._embedded?.author?.[0]?.name || 'Anonim';
      const thumbnail = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
      const categories = post._embedded?.['wp:term']?.[0]?.map((t) => t.name) || [];

      return {
        source_url: post.link,
        source_site: 'khotbahjumat.com',
        raw_title: decodeHtmlEntities(post.title.rendered),
        raw_content: post.content.rendered,
        status: 'draft',
        category: 'khutbah_jumat',
        language: 'id',
        notes: JSON.stringify({
          wp_id: post.id,
          wp_date: post.date,
          wp_author: authorName,
          wp_thumbnail: thumbnail,
          wp_categories: categories,
        }),
      };
    });

    return NextResponse.json({
      rows,
      total_wp: totalPosts,
      total_pages: totalPages,
    });
  } catch (err: any) {
    console.error('WP Sync error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
