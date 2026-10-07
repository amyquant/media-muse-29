import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  className?: string;
}) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const summary =
    value.length === 0
      ? "Tous"
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? "1")
        : `${value.length} sélectionnés`;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("justify-between gap-2 font-normal", className)}>
          <span className="text-muted-foreground">{label} :</span>
          <span className={cn("truncate max-w-[9rem]", value.length && "font-medium text-foreground")}>{summary}</span>
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start">
        <Command>
          <CommandInput placeholder={`Rechercher…`} />
          <CommandList>
            <CommandEmpty>Aucun résultat.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.value} onSelect={() => toggle(o.value)}>
                  <div
                    className={cn(
                      "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                      value.includes(o.value) ? "bg-primary text-primary-foreground" : "opacity-50",
                    )}
                  >
                    {value.includes(o.value) && <Check className="size-3" />}
                  </div>
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {value.length > 0 && (
            <button className="w-full border-t py-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => onChange([])}>
              Effacer la sélection
            </button>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
