import { useCallback, useState } from 'react';

export type State = {
  [key: string]: any;
};

type MethodNames =
  | 'email'
  | 'text'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'raw'
  | 'setFormState'
  | 'clear'
  | 'setInitialState'
  | 'dirty'
  | 'touched';

export type Methods = {
  [key in MethodNames]: any;
};

export type OptionsProp = {
  onChange: Function;
  [key: string]: any;
};

export const useFormState = (_initialState: State): [State, Methods] => {
  const [initialState, _setInitialState] = useState<State>(_initialState);
  const [values, setValues] = useState<State>(_initialState);
  const [dirty, setDirtyItems] = useState<Set<any>>(new Set());
  const [touched, setTouchedItems] = useState<Set<any>>(new Set());

  const setValue = useCallback(
    (name: string, value: any, makeTouched: boolean = true, makeDirty: boolean = true) => {
      setValues((state) => ({
        ...state,
        [name]: value,
      }));

      makeTouched && setTouchedItems((state) => state.add(name));

      if (makeDirty) {
        if (initialState[name]) {
          if (typeof value === 'object') {
            if (JSON.stringify(value) === JSON.stringify(initialState[name])) {
              setDirtyItems((state) => {
                state.delete(name);
                return state;
              });
            } else {
              setDirtyItems((state) => state.add(name));
            }
          } else {
            if (value === initialState[name]) {
              setDirtyItems((state) => {
                state.delete(name);
                return state;
              });
            } else {
              setDirtyItems((state) => state.add(name));
            }
          }
        } else {
          if (value === '' || value === false) {
            setDirtyItems((state) => {
              state.delete(name);
              return state;
            });
          } else {
            setDirtyItems((state) => state.add(name));
          }
        }
      }
    },
    [initialState]
  );

  const setInitialState = useCallback((state: State) => {
    _setInitialState(state);
    setValues(state);
    setDirtyItems(new Set());
    setTouchedItems(new Set());
  }, []);

  const clear = useCallback((name: string) => {
    setValues((state) => ({
      ...state,
      [name]: '',
    }));

    setDirtyItems(new Set());
    setTouchedItems(new Set());
  }, []);

  const text = (name: string, options = {} as OptionsProp) => {
    const { onChange } = options;

    return {
      type: 'text',
      name,
      get value() {
        return values?.[name] || '';
      },
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(name, event.target.value);
        onChange && onChange(event);
      },
    };
  };

  const email = (name: string, options = {} as OptionsProp) => {
    const { onChange } = options;

    return {
      type: 'email',
      name,
      get value() {
        return values?.[name] || '';
      },
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(name, event.target.value);
        onChange && onChange(event);
      },
    };
  };

  const radio = (name: string, value: State, options = {} as OptionsProp) => {
    const { onChange } = options;
    return {
      name,
      value,
      get checked() {
        return values?.[name] === value;
      },
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(name, event.target.value);
        onChange && onChange(event);
      },
    };
  };

  const checkbox = (name: string, value: State, options = {} as OptionsProp) => {
    const { onChange } = options;
    const isArray = name.includes('[]');

    return {
      name,
      value,
      get checked() {
        if (isArray) {
          return (values?.[name] || []).includes(value);
        }

        return values?.[name] || false;
      },
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        if (isArray) {
          const copy = [...(values?.[name] ?? [])];

          if (event.target.checked) {
            copy.push(value);
          } else {
            const index = copy.indexOf(value);

            if (index > -1) {
              copy.splice(index, 1);
            }
          }

          setValue(name, copy);
        } else {
          setValue(name, event.target.checked);
        }

        onChange && onChange(event);
      },
    };
  };

  // This one is always going to return the raw event values
  // of a component so you can use it with wathever you want.
  const raw = (name: string, options = {} as OptionsProp) => {
    const { onChange } = options;
    return {
      name,
      get value() {
        return values?.[name];
      },
      onChange: (value: State) => {
        setValue(name, value);
        onChange && onChange(value);
      },
    };
  };

  return [
    values,
    {
      // Input types methods
      text,
      email,
      radio,
      checkbox,
      select: text,
      raw,

      // Direct access methods
      setFormState: setValue,
      clear,
      setInitialState,
      dirty,
      touched,
    },
  ];
};
