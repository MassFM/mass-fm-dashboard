import { NextResponse } from 'next/server';

const WP_API_URL = 'https://konsultasisyariah.com/wp-json/wp/v2/posts';

interface WPPost {
  id: number;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  _embedded?: {
    author?: Array<{ name: string }>;
    'wp:featuredmedia'?: Array<{ source_url: string }>;
    'wp:term'?: Array<Array<{ name: string; slug: string }>>;
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

/** Map WP category slug to our simplified category */
function mapWpCategory(categories: string[]): string {
  const slugs = categories.map((c) => c.toLowerCase());
  if (slugs.some((s) => s.includes('aqidah'))) return 'aqidah';
  if (slugs.some((s) => s.includes('fikih') || s.includes('sholat') || s.includes('puasa') || s.includes('haji') || s.includes('zakat') || s.includes('bersuci'))) return 'fikih';
  if (slugs.some((s) => s.includes('akhlak') || s.includes('adab'))) return 'akhlak';
  if (slugs.some((s) => s.includes('muamalah') || s.includes('perdagangan') || s.includes('hutang'))) return 'muamalah';
  if (slugs.some((s) => s.includes('pernikahan') || s.includes('rumah-tangga') || s.includes('wanita'))) return 'keluarga';
  if (slugs.some((s) => s.includes('al-quran') || s.includes('hadits'))) return 'quran_hadits';
  if (slugs.some((s) => s.includes('ramadhan'))) return 'ramadhan';
  if (slugs.some((s) => s.includes('kontemporer'))) return 'kontemporer';
  if (slugs.some((s) => s.includes('nasehat') || s.includes('manhaj'))) return 'nasehat';
  if (slugs.some((s) => s.includes('sejarah'))) return 'sejarah';
  return 'fikih';
}

/**
 * POST — Fetch posts dari konsultasisyariah.com, return data siap upsert
 * Body: { page, per_page, category? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const page = body.page || 1;
    const perPage = body.per_page || 20;
    const categoryId = body.category_id; // optional WP category filter

    let wpUrl = `${WP_API_URL}?per_page=${perPage}&page=${page}&_embed&orderby=date&order=desc`;
    if (categoryId) wpUrl += `&categories=${categoryId}`;

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

    const rows = posts.map((post) => {
      const authorName = post._embedded?.author?.[0]?.name || 'Anonim';
      const thumbnail = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
      const catNames = post._embedded?.['wp:term']?.[0]?.map((t) => t.name) || [];
      const catSlugs = post._embedded?.['wp:term']?.[0]?.map((t) => t.slug) || [];

      return {
        source_url: post.link,
        source_site: 'konsultasisyariah.com',
        raw_title: decodeHtmlEntities(post.title.rendered),
        raw_content: post.content.rendered,
        status: 'draft',
        category: mapWpCategory(catSlugs),
        notes: JSON.stringify({
          wp_id: post.id,
          wp_date: post.date,
          wp_author: authorName,
          wp_thumbnail: thumbnail,
          wp_categories: catNames,
          wp_category_slugs: catSlugs,
        }),
      };
    });

    return NextResponse.json({
      rows,
      total_wp: totalPosts,
      total_pages: totalPages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Konsultasi WP Sync error:', err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
