
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const aboutPageContent = {
  "hero.title": "من نحن",
  "hero.subtitle": "تعرف على قصتنا",
  "story.title": "قصتنا",
  "story.paragraph1": "بدأت رحلتنا من حلم بسيط: توفير منتجات عالية الجودة بأسعار منافسة. نؤمن بأن كل عميل يستحق تجربة تسوق مميزة وخدمة عملاء استثنائية.",
  "story.paragraph2": "منذ انطلاقتنا، كرسنا جهودنا لتقديم منتجات تعكس الجودة العالية. نهتم بأدق التفاصيل في كل منتج نقدمه لك.",
  "story.image_url": "https://i.postimg.cc/W3sT29vC/story-image.jpg",
  "values.title": "قيمنا",
  "values.passion.title": "الشغف",
  "values.passion.description": "نحب ما نقوم به ونسعى دائماً لتقديم الأفضل لعميلاتنا",
  "values.quality.title": "الجودة",
  "values.quality.description": "نختار أفضل الأقمشة ونهتم بأدق التفاصيل في كل منتج",
  "values.customers.title": "العملاء",
  "values.customers.description": "رضاكِ وسعادتكِ هما أولويتنا القصوى في كل ما نقدمه",
  "values.innovation.title": "الابتكار",
  "values.innovation.description": "نواكب أحدث صيحات الموضة مع الحفاظ على الأصالة",
  "team.title": "فريقنا وشغفنا",
  "team.paragraph1": "وراء كل منتج، يقف فريق من المحترفين الذين يجمعهم شغف واحد: تقديم الأفضل لعملائنا. نحن عائلة تؤمن بقوة التفاصيل وتكرس وقتها لتحقيق رضاك.",
  "team.paragraph2": "كل تفصيلة هي جزء من حكايتنا معك.",
  "team.image_url": "https://i.postimg.cc/mD4x1gbP/team-image.jpg",
  "team.image_title": "فريق العمل",
  "team.image_subtitle": "شغف يتوارثه الأجيال",
  "cta.title": "ابدئي رحلتكِ معنا",
  "cta.subtitle": "اكتشفي مجموعتنا الحصرية من الأزياء الراقية",
  "cta.button": "تسوقي الآن"
};

export async function POST() {
  try {
    const supabase: any = await createClient();

    const userRes = await supabase.auth.getUser();
    const authError = (userRes as any).error
    const user = (userRes as any)?.data?.user
    if (authError || !user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: "User is not an admin" }, { status: 403 });
    }

  const { data: page, error: findError } = await supabase
    .from('pages')
    .select('id, sections')
    .eq('path', '/about/')
    .single();

  if (findError && findError.code !== 'PGRST116') {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

    if (!page) {
    const { error: createError } = await supabase.from('pages').insert([{
      path: '/about/',
      title_ar: 'من نحن',
      title_en: 'About Us',
      sections: aboutPageContent,
      is_published: true,
    }]);

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      return NextResponse.json({ message: "Successfully created and seeded '/about/' page." });
  }
    const existingSections = (page.sections as Record<string, string>) || {};
    const mergedSections = { ...aboutPageContent, ...existingSections };

    const { error: updateError } = await supabase
      .from('pages')
      .update({ sections: mergedSections })
      .eq('id', page.id);

    if (updateError) {
      console.error("Error updating page content:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "'/about/' page content has been successfully seeded/merged." });
  } catch (err: any) {
    console.error('[api/seed-about] unexpected error:', err);
    return NextResponse.json({ error: (err && err.message) ? err.message : String(err) }, { status: 500 });
  }
}
