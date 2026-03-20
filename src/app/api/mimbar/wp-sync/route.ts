import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const page = body.page || 1;
    const perPage = body.per_page || 20;

    // Fetch posts dari WordPress REST API
    const wpRes = await fetch(
      `${WP_API_URL}?per_page=${perPage}&page=${page}&_embed&orderby=date&order=desc`,
      {
        headers: { 'User-Agent': 'MassFM-Dashboard/1.0' },
        next: { revalidate: 0 },
      }
    );

    if (!wpRes.ok) {
      return NextResponse.json(
        { error: `WordPress API error: ${wpRes.status} ${wpRes.statusText}` },
        { status: 502 }
      );
    }

    const posts: WPPost[] = await wpRes.json();
    const totalPages = parseInt(wpRes.headers.get('X-WP-TotalPages') || '1');
    const totalPosts = parseInt(wpRes.headers.get('X-WP-Total') || '0');

    if (!posts.length) {
      return NextResponse.json({
        synced: 0,
        skipped: 0,
        total_wp: totalPosts,
        total_pages: totalPages,
        message: 'Tidak ada post ditemukan',
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

    // Upsert ke pending_materials — skip duplikat berdasarkan source_url
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('pending_materials')
      .upsert(rows as any, {
        onConflict: 'source_url',
        ignoreDuplicates: true,
      })
      .select('id');

    if (error) {
      return NextResponse.json(
        { error: `Supabase error: ${error.message}` },
        { status: 500 }
      );
    }

    const synced = data?.length || 0;
    const skipped = posts.length - synced;

    return NextResponse.json({
      synced,
      skipped,
      total_wp: totalPosts,
      total_pages: totalPages,
      message: synced > 0
        ? `Berhasil mengimpor ${synced} artikel baru`
        : `Semua ${posts.length} artikel sudah ada di database`,
    });
  } catch (err: any) {
    console.error('WP Sync error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/** GET — cek status terakhir sync */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: stats } = await supabase
      .from('pending_materials')
      .select('status')
      .eq('source_site', 'khotbahjumat.com');

    const counts = {
      draft: 0,
      reviewed: 0,
      published: 0,
      rejected: 0,
      total: stats?.length || 0,
    };

    stats?.forEach((row: any) => {
      const s = row.status as keyof typeof counts;
      if (s in counts) counts[s]++;
    });

    return NextResponse.json(counts);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
