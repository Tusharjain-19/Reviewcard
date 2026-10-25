import type { CSSProperties } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildLinkUrl,
  buttonIds,
  moveButton,
  REVIEW_BUTTON_ID,
  LINK_LABELS,
  type LinkType,
  type Business,
} from "@/lib/reviewcard";

export function ButtonEditor({
  b,
  onChange,
}: {
  b: Business;
  onChange: (patch: Partial<Business>) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = buttonIds(b);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id)
          onChange({ buttonOrder: moveButton(b, String(active.id), String(over.id)) });
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {ids.map((id, index) => (
            <ButtonRow key={id} id={id} index={index} ids={ids} b={b} onChange={onChange} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function ButtonRow({
  id,
  index,
  ids,
  b,
  onChange,
}: {
  id: string;
  index: number;
  ids: string[];
  b: Business;
  onChange: (patch: Partial<Business>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: id === REVIEW_BUTTON_ID,
  });
  const link = b.links.find((l) => l.id === id);
  const review = id === REVIEW_BUTTON_ID;
  if (!review && !link) return null;
  const label = review ? (b.reviewLabel ?? "Leave us a Google review") : (link?.label ?? "");
  const url = review ? b.reviewUrl : link ? buildLinkUrl(link) : null;
  const update = (patch: { label?: string; value?: string }) => {
    if (review)
      onChange({
        ...(patch.label !== undefined ? { reviewLabel: patch.label } : {}),
        ...(patch.value !== undefined ? { reviewUrl: patch.value } : {}),
      });
    else onChange({ links: b.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  };
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex min-w-0 gap-2 rounded-md border bg-background p-3 ${isDragging ? "shadow-lift" : ""}`}
    >
      {review ? (
        <span
          title="Review always first"
          className="flex h-9 w-9 shrink-0 items-center justify-center"
        >
          <Lock className="h-4 w-4" />
        </span>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 touch-none cursor-grab"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${label}`}
          title={`Drag ${label}`}
        >
          <GripVertical />
        </Button>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <Input
          aria-label={`${review ? "Review" : link?.type} button label`}
          value={label}
          onChange={(e) => update({ label: e.target.value })}
        />
        <Input
          aria-label={`${review ? "Review" : link?.type} button destination`}
          value={review ? b.reviewUrl : (link?.value ?? "")}
          placeholder={review ? "https://g.page/…/review" : "https://… or phone / email / handle"}
          onChange={(e) => update({ value: e.target.value })}
        />
        {!review && link?.value && !url && (
          <p className="text-xs text-destructive">Enter a valid link or contact detail.</p>
        )}
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={index <= 1}
            title="Move up"
            aria-label={`Move ${label} up`}
            onClick={() => {
              const previous = ids[index - 1];
              if (previous) onChange({ buttonOrder: moveButton(b, id, previous) });
            }}
          >
            <ArrowUp />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={review || index === ids.length - 1}
            title="Move down"
            aria-label={`Move ${label} down`}
            onClick={() => {
              const next = ids[index + 1];
              if (next) onChange({ buttonOrder: moveButton(b, id, next) });
            }}
          >
            <ArrowDown />
          </Button>
          {url && (
            <Button asChild size="icon" variant="ghost">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Test ${label}`}
                title="Test link"
              >
                <ExternalLink />
              </a>
            </Button>
          )}
          {!review && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Toggle ${label} visibility`}
                onClick={() =>
                  onChange({
                    links: b.links.map((l) => (l.id === id ? { ...l, hidden: !l.hidden } : l)),
                  })
                }
              >
                {link?.hidden ? <EyeOff /> : <Eye />}
              </Button>
              <select
                aria-label={`${label} icon`}
                className="max-w-28 rounded-md border bg-background text-xs"
                value={link?.icon ?? link?.type}
                onChange={(e) =>
                  onChange({
                    links: b.links.map((l) =>
                      l.id === id ? { ...l, icon: e.target.value as LinkType } : l,
                    ),
                  })
                }
              >
                {Object.entries(LINK_LABELS).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </>
          )}
          {!review && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${label}`}
              title="Remove button"
              onClick={() => onChange({ links: b.links.filter((l) => l.id !== id) })}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
