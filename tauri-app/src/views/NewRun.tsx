import {Provider} from "../components/ui/provider";
import { Field } from "@chakra-ui/react"

function NewRun(){
    return(
        <Provider>
            <Field.Root>
                <Field.Label>
                    Nome da corrida
                </Field.Label>
            </Field.Root>
        </Provider>

    );
}

export default NewRun;