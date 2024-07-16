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
    <li className={`flex gap-1 items-center ${strikethrough ? "line-through" : ""} ${className}`}>
      {index !== undefined && <span className="mr-2 font-bold">{index + 1}.</span>}
      {bullet && <Bullet active={active} />}
      {children}
    </li>
  );
};

const Bullet = ({ active }: { active?: boolean }) => {
  return (
    <div className="w-3 h-3 border border-primary border-2 aspect-square flex justify-center items-center">
      {active && <div className="w-2 h-2 bg-accent"></div>}
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

  return <ListTag className={`list-none shadow rounded-lg ${className}`}>{enhancedChildren}</ListTag>;
};

List.Item = ListItem;
