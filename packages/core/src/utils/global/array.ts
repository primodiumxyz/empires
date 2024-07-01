/**
 * Get the last element of an array without throwing an error
 * @param index index of the element
 * @param arr array to get the element from
 * @returns element at the index or the last element if the index is out of bounds
 */
export function safeIndex<Element>(index: number, arr: Array<Element>): Element {
  if (index < 0) {
    index = 0;
  }
  if (index >= arr.length) {
    index = arr.length - 1;
  }
  return arr[index];
}
