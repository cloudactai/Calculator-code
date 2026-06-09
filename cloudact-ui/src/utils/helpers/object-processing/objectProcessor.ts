type ObjectStats = {
  fields: number;
  fieldsFilled: number;
};

const objectProcessor = (obj: Record<string, any>): ObjectStats => {
  let fields = 0;
  let fieldsFilled = 0;

  const calculateFields = (innerObj: Record<string, any>) => {
    for (const key in innerObj) {
      if (innerObj.hasOwnProperty(key)) {
        if (typeof innerObj[key] === "object") {
          calculateFields(innerObj[key]);
        } else {
          fields++;

          if (innerObj[key] !== "") {
            fieldsFilled++;
          }
        }
      }
    }
  };

  calculateFields(obj);

  return { fields, fieldsFilled };
};

export default objectProcessor;
