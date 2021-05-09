import { Identifiers } from '../identifiers'
import { Acknowledge } from './acknowledge'

export class Acknowledgement extends Acknowledge {
  public constructor() {
    super(Identifiers.ACKNOWLEDGEMENT)
  }
}
