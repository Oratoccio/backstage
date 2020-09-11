/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useReducer } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import {
  List,
  ListItem,
  ListItemIcon,
  Checkbox,
  ListItemText,
  Collapse,
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

type IndexedObject<T> = {
  [key: string]: T;
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.palette.background.paper,
    },
    nested: {
      paddingLeft: theme.spacing(4),
    },
  }),
);

/* SUB_CATEGORY */

type SubCategory = {
  label: string;
  isChecked?: boolean;
  isOpen?: boolean;
  options?: Option[];
};

type SubCategoryWithIndexedOptions = {
  label: string;
  isChecked?: boolean;
  isOpen?: boolean;
  options: IndexedObject<Option>;
};

/* OPTION */

type Option = {
  label: string;
  value: string | number;
  isChecked?: boolean;
};

type Props = {
  subCategories: SubCategory[];
};

/* REDUCER */

type checkOptionPayload = {
  subCategoryLabel: string;
  optionLabel: string;
};

type Action =
  | { type: 'checkOption'; payload: checkOptionPayload }
  | { type: 'checkCategory'; payload: string }
  | { type: 'openCategory'; payload: string };

const checkAllOptions = (
  arr: Option[],
  isChecked: boolean,
): IndexedObject<Option> =>
  arr.reduce((accumulator, el) => {
    return {
      ...accumulator,
      [el.label]: { ...el, isChecked },
    };
  }, {});

const reducer = (
  state: IndexedObject<SubCategoryWithIndexedOptions>,
  action: Action,
) => {
  switch (action.type) {
    case 'checkOption': {
      const newOptions = {
        ...state[action.payload.subCategoryLabel].options,
        [action.payload.optionLabel]: {
          ...state[action.payload.subCategoryLabel].options[
            action.payload.optionLabel
          ],
          isChecked: !state[action.payload.subCategoryLabel].options[
            action.payload.optionLabel
          ].isChecked,
        },
      };

      return {
        ...state,
        [action.payload.subCategoryLabel]: {
          ...state[action.payload.subCategoryLabel],
          isChecked: Object.values(newOptions).every(
            option => option.isChecked,
          ),
          options: newOptions,
        },
      };
    }
    case 'checkCategory':
      return {
        ...state,
        [action.payload]: {
          ...state[action.payload],
          isChecked: !state[action.payload].isChecked,
          options: checkAllOptions(
            Object.values(state[action.payload].options),
            !state[action.payload].isChecked,
          ),
        },
      };
    case 'openCategory':
      return {
        ...state,
        [action.payload]: {
          ...state[action.payload],
          isOpen: !state[action.payload].isOpen,
        },
      };
    default:
      return state;
  }
};

const indexer = (
  arr: SubCategory[],
): IndexedObject<SubCategoryWithIndexedOptions> =>
  arr.reduce((accumulator, el) => {
    if (el.options) {
      return {
        ...accumulator,
        [el.label]: {
          label: el.label,
          isChecked: el.isChecked || false,
          isOpen: true,
          options: indexer(el.options),
        },
      };
    }
    return {
      ...accumulator,
      [el.label]: { ...el, isChecked: el.isChecked || false },
    };
  }, {});

export const CheckboxTree = (props: Props) => {
  const classes = useStyles();

  const [state, dispatch] = useReducer(reducer, indexer(props.subCategories));

  const handleOpen = (event: any, value: any) => {
    event.stopPropagation();
    dispatch({ type: 'openCategory', payload: value });
  };
  return (
    <List className={classes.root}>
      {Object.values(state).map(item => {
        const labelId = `checkbox-list-label-${item?.label}`;

        return (
          <div key={item.label}>
            <ListItem
              dense
              button
              onClick={() =>
                dispatch({
                  type: 'checkCategory',
                  payload: item.label,
                })
              }
            >
              <ListItemIcon>
                <Checkbox
                  color="primary"
                  edge="start"
                  checked={item.isChecked}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={item.label} />
              {item.options?.length ? (
                <ExpandLess onClick={event => handleOpen(event, item.label)} />
              ) : (
                <ExpandMore onClick={event => handleOpen(event, item.label)} />
              )}
            </ListItem>
            <Collapse in={item.isOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {Object.values(item.options).map(option => (
                  <ListItem
                    button
                    key={option.label}
                    className={classes.nested}
                    onClick={() =>
                      dispatch({
                        type: 'checkOption',
                        payload: {
                          subCategoryLabel: item.label,
                          optionLabel: option.label,
                        },
                      })
                    }
                  >
                    <ListItemIcon>
                      <Checkbox
                        color="primary"
                        edge="start"
                        checked={option.isChecked}
                        tabIndex={-1}
                        disableRipple
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={option.label} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </div>
        );
      })}
    </List>
  );
};
