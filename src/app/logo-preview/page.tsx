export default function LogoPreview() {
  const logos = [
    { id: 1, src: "/logo-option-1.jpg", title: "الخيار 1: صورة ظلية أنيقة مع نص عربي" },
    { id: 2, src: "/logo-option-2.jpg", title: "الخيار 2: وجه محجبة بأسلوب minimalist" },
    { id: 3, src: "/logo-option-3.jpg", title: "الخيار 3: صورة جانبية مع زخارف إسلامية" },
    { id: 4, src: "/logo-option-4.jpg", title: "الخيار 4: تصميم دائري مع عناصر زخرفية" },
  ]

  return (
    <div className="min-h-screen bg-background p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-primary">اختاري اللوجو المناسب لموقعك</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {logos.map((logo) => (
            <div key={logo.id} className="bg-card rounded-lg p-8 shadow-lg border border-border">
              <div className="bg-background rounded-lg p-8 mb-4 flex items-center justify-center min-h-[300px]">
                <img
                  src={logo.src || "/placeholder.svg"}
                  alt={logo.title}
                  className="max-w-full max-h-[250px] object-contain"
                />
              </div>
              <h3 className="text-xl font-semibold text-center text-foreground">{logo.title}</h3>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-lg">جميع التصاميم بألوان الموقع الوردية وتعبر عن الحجاب والاحتشام</p>
        </div>
      </div>
    </div>
  )
}
