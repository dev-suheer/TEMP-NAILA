
import Icon from "./Icons";

const BooleanIndicator = ({ value, size = 20 }) => {
  const isTrue = Boolean(value);

  return (
    <div className="flex justify-center items-center">
      {isTrue ? (
        <Icon name='tick' size={size}/>
      ) : (
        <Icon name='cross' size={size}/>
      )}
    </div>
  );
};

export default BooleanIndicator;
