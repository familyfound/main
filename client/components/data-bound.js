
module.exports = {
  getInitialState: function () {
    return {
      data: this.props.initialData
    }
  },
  getDefaultProps: function () {
    return {
      id: null,
      manager: null,
      initialData: null
    }
  },
  componentDidMount: function () {
    if (!this.props.manager) return
    this.props.manager.on(this.props.id, this.gotData)
  },
  componentWillUnmount: function () {
    if (!this.props.manager) return
    this.props.manager.off(this.props.id, this.gotData)
  },
  componentWillReceiveProps: function (props) {
    if (props.id === this.props.id) return
    if (!this.props.manager) return
    this.props.manager.off(this.props.id, this.gotData)
    this.props.manager.on(props.id, this.gotData)
  },
  gotData: function (data) {
    this.setState({data: data})
  },
}

