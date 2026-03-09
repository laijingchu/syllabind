import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';

export default function ComponentCuratorRecruitCard() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">CuratorRecruitCard</h1>
          <p className="text-lg text-muted-foreground">
            A full-width card that pitches users to become curators. Explains the 3-step process (create, submit, get featured) with a nested section showcasing currently featured binders as social proof.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use CuratorRecruitCard</strong> at the bottom of the reader dashboard, spanning all 12 grid columns, to recruit new curators.</p>
            <p>The component self-hides when the user already has a featured (demo) binder, unless they are an admin.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Layout</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Two-column on desktop:</strong> Left side has the pitch copy and 3-step process. Right side shows featured binders with curator avatars as social proof.</p>
            <p><strong className="text-foreground">Single column on mobile:</strong> Stacks vertically with featured binders below the pitch.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { CuratorRecruitCard } from '@/components/CuratorRecruitCard';

// Full-width inside the dashboard grid
<AnimatedCard className="col-span-12">
  <CuratorRecruitCard />
</AnimatedCard>`}</CodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <p className="text-base text-muted-foreground">
            <strong className="text-foreground">Reader Dashboard:</strong> Spans all 12 columns at the bottom of the dashboard grid, below both the primary content and sidebar. Replaces the previous sidebar-only FeaturedBinderCard.
          </p>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
