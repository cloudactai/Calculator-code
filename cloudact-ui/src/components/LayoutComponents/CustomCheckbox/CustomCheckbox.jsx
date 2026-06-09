import './CustomCheckbox.css'

const CustomCheckbox = ({ ChangeFun, label="", checked=false, name="" }) => {


    return (
        <div style={{ display: "flex" }}>
            <div class="checkbox-wrapper-12">
                <div class="cbx">
                    <input
                        id="cbx-12"
                        type="checkbox"
                        onChange={ChangeFun}
                        name={name}
                        checked={checked}

                    />
                    <label for="cbx-12"></label>
                    <svg width="15" height="14" viewbox="0 0 15 14" fill="none">
                        <path d="M2 8.36364L6.23077 12L13 2"></path>
                    </svg>
                </div>

                <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
                    <defs>
                        <filter id="goo-12">
                            <fegaussianblur
                                in="SourceGraphic"
                                stddeviation="4"
                                result="blur"
                            ></fegaussianblur>
                            <fecolormatrix
                                in="blur"
                                mode="matrix"
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7"
                                result="goo-12"
                            ></fecolormatrix>
                            <feblend in="SourceGraphic" in2="goo-12"></feblend>
                        </filter>
                    </defs>
                </svg>
            </div>
            <div style={{
                margin: "0px 0px 0px 10px", fontSize: "14px",
                fontWeight: 700,
                minHeight: "20px"
            }}
            >
                <p> {label}</p>
            </div>
        </div>

    )
}

export default CustomCheckbox;