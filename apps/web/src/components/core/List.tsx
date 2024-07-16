import React from "react";

// Define the ListItem component
type ListItemProps = {
  children: React.ReactNode;
  active?: boolean;
  strikethrough?: boolean;
  index?: number; // Optional index for ordered lists
  bullet?: boolean;
  className?: string;
};

const ListItem: React.FC<ListItemProps> = ({
  children,
  active = false,
  strikethrough = false,
  index,
  bullet = false,
  className,
}) => {
  return (
    <li className={`flex items-center gap-1 ${strikethrough ? "line-through" : ""} ${className}`}>
      {index !== undefined && <span className="mr-2 font-bold">{index + 1}.</span>}
      {bullet && <Bullet active={active} />}
      {children}
    </li>
  );
};

const Bullet = ({ active }: { active?: boolean }) => {
  return (
    <div className="flex aspect-square h-3 w-3 items-center justify-center border border-2 border-primary">
      {active && <div className="h-2 w-2 bg-accent"></div>}
    </div>
  );
};

// Define the List component
type ListProps = {
  children: React.ReactElement[] | React.ReactElement;
  className?: string;
  ordered?: boolean;
};

export const List: React.FC<ListProps> & { Item: React.FC<ListItemProps> } = ({
  className,
  children,
  ordered = false,
}) => {
  const ListTag = ordered ? "ol" : "ul";

  // Enhance children with index prop if ordered
  const enhancedChildren = React.Children.map(children, (child: React.ReactElement<ListItemProps>, index) => {
    if (React.isValidElement(child)) {
      return ordered ? React.cloneElement(child, { index }) : React.cloneElement(child, { bullet: true });
    }
    return child;
  });

  return <ListTag className={`list-none rounded-lg shadow ${className}`}>{enhancedChildren}</ListTag>;
};

List.Item = ListItem;
