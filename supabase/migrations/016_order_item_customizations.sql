-- Add JSONB column for order item customizations
-- Stores removed ingredients, add-ons/extra items, and drink selections per item

alter table public.order_items
  add column customizations jsonb not null default '{}'::jsonb;

comment on column public.order_items.customizations is
  'Customization data: { removedIngredients: string[], addOns: {id, name, price}[], drinks: {id, name, price}[] }';
