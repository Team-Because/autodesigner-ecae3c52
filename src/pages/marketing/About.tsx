import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BrandFolder } from "@/components/marketing/folder/BrandFolder";

const clientFolders = [
  { name: "Meridian", color: { light: "hsl(210 100% 74%)", deep: "hsl(210 76% 40%)" }, palette: ["#3D9BFF", "#14162B", "#FFF"] },
  { name: "Kalrav", color: { light: "hsl(158 66% 60%)", deep: "hsl(158 71% 32%)" }, palette: ["#22C08E", "#0F3D2E", "#F4EEDF"] },
  { name: "Anantara", color: { light: "hsl(30 88% 68%)", deep: "hsl(20 80% 42%)" }, palette: ["#E8894B", "#3A2114", "#F5EBDF"] },
  { name: "LION", color: { light: "hsl(44 100% 66%)", deep: "hsl(39 80% 46%)" }, palette: ["#FFC93C", "#14162B", "#FFF"] },
];

export default function About() {
  return (
    <>
      <SEO
        title="About — BDesign by Because"
        description="BDesign started as an internal tool at Because, a branding and marketing agency in Ahmedabad. It worked well enough that we're opening it up."
        path="/about"
      />

      <section className="max-w-[1180px] mx-auto px-6 py-20 grid lg:grid-cols-12 gap-14 items-start">
        <div className="lg:col-span-7">
          <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-blue-700">about</p>
          <h1 className="mt-4 text-[40px] md:text-[52px] font-extrabold tracking-tight leading-[1.05]">
            BDesign started as an{" "}
            <span className="yellow-underline">internal tool</span>.
          </h1>

          <div className="mt-8 space-y-5 text-[16.5px] text-ink-soft leading-relaxed">
            <p>
              We're <span className="font-semibold text-ink">Because</span> — a branding and marketing agency in Ahmedabad (legally, Rellow Digital Private Limited). We work across real estate, education, and consumer brands. Like every agency, we spent afternoons re-briefing the same brand context every time a client sent us a new creative reference.
            </p>
            <p>
              BDesign was the fix. A place where each brand lived once, properly. Any reference could be dropped in and rebuilt without a designer walking the model through the brand book again. Our team stopped opening Photoshop for adaptation work.
            </p>
            <p>
              We're opening it up because the problem isn't ours alone.
            </p>
            <p>
              Want to talk?{" "}
              <Link to="/contact" className="text-blue-700 underline">Contact the team</Link>{" "}
              or visit{" "}
              <a href="https://teambecause.com" rel="noopener" className="text-blue-700 underline">
                teambecause.com
              </a>.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="p-8 rounded-folder border border-line bg-paper">
            <div className="font-mono-sys text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-6">brands we've built</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 justify-items-center">
              {clientFolders.map((b) => (
                <BrandFolder key={b.name} name={b.name} size="sm" color={b.color} palette={b.palette} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
