import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

export default function UITable() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Table</h1>
          <p className="text-lg text-muted-foreground">
            A semantic HTML table with styled subcomponents for displaying structured data.
            Composed of Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
            TableCaption, and TableFooter.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Table</strong> for displaying tabular data with rows and columns, such as reader lists, analytics summaries, or any structured dataset.</p>
            <p><strong className="text-foreground">Use a list or cards</strong> instead when items don't have a consistent columnar structure or when the data is better represented as individual entries.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6">
            <Table>
              <TableCaption>Readers enrolled in Digital Minimalism</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Reader</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Steps Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Alice Chen</TableCell>
                  <TableCell>Jan 15, 2026</TableCell>
                  <TableCell>Week 3 of 5</TableCell>
                  <TableCell className="text-right">12 / 20</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bob Martinez</TableCell>
                  <TableCell>Jan 18, 2026</TableCell>
                  <TableCell>Week 2 of 5</TableCell>
                  <TableCell className="text-right">8 / 20</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Carol Johnson</TableCell>
                  <TableCell>Jan 20, 2026</TableCell>
                  <TableCell>Week 4 of 5</TableCell>
                  <TableCell className="text-right">16 / 20</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">David Kim</TableCell>
                  <TableCell>Feb 1, 2026</TableCell>
                  <TableCell>Week 1 of 5</TableCell>
                  <TableCell className="text-right">3 / 20</TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">39 / 80</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Hover row</p>
              <Table>
                <TableBody>
                  <TableRow className="bg-muted">
                    <TableCell className="font-medium">Hovered row</TableCell>
                    <TableCell>Shows muted background on hover</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected row</p>
              <Table>
                <TableBody>
                  <TableRow data-state="selected">
                    <TableCell className="font-medium">Selected row</TableCell>
                    <TableCell>Uses data-[state=selected] for muted background</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Rows transition to <code className="text-primary bg-muted px-1 rounded">bg-muted</code> on hover.
            Selected rows use the <code className="text-primary bg-muted px-1 rounded">data-[state=selected]</code> attribute for a solid muted background.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--border" value="Row and header border color" />
            <TokenRow token="--muted" value="Footer background, hover/selected row fill" />
            <TokenRow token="--muted-foreground" value="Header cell and caption text color" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  Table, TableHeader, TableBody, TableFooter,
  TableRow, TableHead, TableCell, TableCaption,
} from '@/components/ui/table';

<Table>
  <TableCaption>A list of enrolled readers.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Reader</TableHead>
      <TableHead>Progress</TableHead>
      <TableHead className="text-right">Steps</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">Alice Chen</TableCell>
      <TableCell>Week 3 of 5</TableCell>
      <TableCell className="text-right">12 / 20</TableCell>
    </TableRow>
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>Total</TableCell>
      <TableCell className="text-right">12 / 20</TableCell>
    </TableRow>
  </TableFooter>
</Table>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Semantic HTML:</strong> Uses native <code className="text-primary bg-muted px-1 rounded">&lt;table&gt;</code>, <code className="text-primary bg-muted px-1 rounded">&lt;thead&gt;</code>, <code className="text-primary bg-muted px-1 rounded">&lt;tbody&gt;</code>, <code className="text-primary bg-muted px-1 rounded">&lt;th&gt;</code>, and <code className="text-primary bg-muted px-1 rounded">&lt;td&gt;</code> elements for proper screen reader support.</p>
            <p><strong className="text-foreground">Caption:</strong> TableCaption renders a <code className="text-primary bg-muted px-1 rounded">&lt;caption&gt;</code> element, providing an accessible description of the table's purpose.</p>
            <p><strong className="text-foreground">Responsive:</strong> The table wrapper uses <code className="text-primary bg-muted px-1 rounded">overflow-auto</code> to allow horizontal scrolling on narrow viewports without breaking layout.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderReaders:</strong> Displays the list of enrolled readers with their progress, enrollment date, and completion stats.</p>
            <p><strong className="text-foreground">Analytics:</strong> Data tables showing binder performance metrics, step completion rates, and reader engagement.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
