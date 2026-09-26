import Button from "./Button";
import SpinnerMini from "./SpinnerMini";

type deleItm = {
  item: string;
  deleteFn?: () => void;
  close: () => void;
  loading: boolean;
};
function DeleteModal({ item, deleteFn, close, loading }: deleItm) {
  return (
    <div className="w-full h-full flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-grey-500 mb-3">
        Are you sure you want to delete this {item}? This action cannot be
        reversed, and all the data inside it will be removed forever.
      </p>

      <Button
        className="flex items-center justify-center"
        type="danger"
        onClick={deleteFn}
      >
        {loading ? <SpinnerMini /> : "Yes, confirm deletion"}
      </Button>

      <Button
        className="flex items-center justify-center"
        type="secondary"
        onClick={close}
      >
        No, go back
      </Button>
    </div>
  );
}

export default DeleteModal;
