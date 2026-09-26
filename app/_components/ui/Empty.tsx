import GridItems from "../overview/GridItems";

type EmptyProp = {
  name: string;
};

function Empty({ name }: EmptyProp) {
  return (
    <GridItems className="h-full min-h-[320px] flex flex-col gap-3 items-center justify-center text-center border-dashed !border-grey-300 !shadow-none">
      <span className="h-12 w-12 rounded-full bg-beige-100 flex items-center justify-center text-2xl text-grey-500">
        ∅
      </span>
      <p className="font-bold text-grey-900">Nothing here yet</p>
      <p className="text-sm text-grey-500">{name} has no activities yet</p>
    </GridItems>
  );
}

export default Empty;
