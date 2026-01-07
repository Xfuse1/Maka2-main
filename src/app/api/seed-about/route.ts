
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const aboutPageContent = {
  "hero.title": "من نحن",
  "hero.subtitle": "رحلتنا في عالم الموضة المحتشمة",
  "story.title": "قصتنا",
  "story.paragraph1": "بدأت رحلة مكة من حلم بسيط: توفير أزياء نسائية راقية تجمع بين الأناقة العصرية والاحتشام الأصيل. نؤمن بأن كل امرأة تستحق أن تشعر بالثقة والجمال في ملابسها، دون التنازل عن قيمها ومبادئها.",
  "story.paragraph2": "منذ انطلاقتنا، كرسنا جهودنا لتقديم تصاميم فريدة تعكس الذوق الرفيع والجودة العالية. نختار أقمشتنا بعناية فائقة، ونهتم بأدق التفاصيل في كل قطعة نقدمها لكِ.",
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
  "team.paragraph1": "وراء كل قطعة فنية من مكة، يقف فريق من المصممين والحرفيين المهرة الذين يجمعهم شغف واحد: إبداع أزياء تعبر عنكِ. نحن عائلة تؤمن بقوة التفاصيل وتكرس وقتها لتحويل أجود الأقمشة إلى تصاميم تحاكي أحلامك.",
  "team.paragraph2": "كل خيط، كل قصة، وكل تطريزة هي جزء من حكايتنا معكِ.",
  "team.image_url": "https://i.postimg.cc/mD4x1gbP/team-image.jpg",
  "team.image_title": "مؤسسي مكة",
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
